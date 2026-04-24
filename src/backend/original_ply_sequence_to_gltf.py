"""
Converts a sequence of PLY mesh files into a glTF 2.0 animation file using morph targets. 

Requirements:
    pip install trimesh pygltflib numpy

Usage:
    python ply_sequence_to_gltf.py --input "meshes/*.ply" --output "animation/skier.glb" --fps 60

Notes:
    All PLY files MUST have the same vertex and face count.
"""

import argparse
import glob
import numpy as np
import trimesh
from pygltflib import *

def load_ply_files(pattern: str) -> list[trimesh.Trimesh]:
    """
    Loads the ply files with a given pattern
    """
    paths = sorted(glob.glob(pattern))
    if len(paths) < 2:
        raise ValueError(f"Need at least 2 PLY files, found {len(paths)} matching '{pattern}'")
    print(f"Loading {len(paths)} PLY files...")
    meshes = []
    for p in paths:
        m = trimesh.load(p, process=False, force="mesh")
        if not isinstance(m, trimesh.Trimesh):
            raise TypeError(f"{p} did not load as a Trimesh (got {type(m)})")
        meshes.append(m)
        print(f"  {p}  — {len(m.vertices)} verts, {len(m.faces)} faces")
    return meshes


def validate_meshes(meshes: list[trimesh.Trimesh]):
    """
    Topology check on vertex and face counts, not connectivity though
    """
    n_verts = len(meshes[0].vertices)
    n_faces = len(meshes[0].faces)
    for i, m in enumerate(meshes[1:], 1):
        if len(m.vertices) != n_verts:
            raise ValueError(
                f"Frame {i} has {len(m.vertices)} vertices but frame 0 has {n_verts}. "
            )
        if len(m.faces) != n_faces:
            raise ValueError(
                f"Frame {i} has {len(m.faces)} faces but frame 0 has {n_faces}."
            )
    print(f"Topology consistent — {n_verts} vertices, {n_faces} faces across all frames.")

def pack_with_padding(data: bytes) -> bytes:
    """
    Converts binary data to align with 4-byte boundaries, which is what glTF requires
    """
    remainder = len(data) % 4
    if remainder:
        data += b"\x00" * (4 - remainder)
    return data

def build_gltf(meshes: list[trimesh.Trimesh], fps: float) -> GLTF2:
    gltf = GLTF2()
    gltf.asset = Asset(version="2.0", generator="ply_sequence_to_gltf.py")

    # Base mesh at frame 0
    base_verts = np.array(meshes[0].vertices, dtype=np.float32)
    base_faces = np.array(meshes[0].faces,    dtype=np.uint32)

    # Morph target deltas: shape (N_targets, V, 3)
    n_targets = len(meshes) - 1
    deltas = np.stack(
        [np.array(m.vertices, dtype=np.float32) - base_verts for m in meshes[1:]],
        axis=0,
    )

    # Animation timestamps
    n_frames = len(meshes)
    times = np.arange(n_frames, dtype=np.float32) / fps

    # Binary blob
    # Layout:
    #   [positions]  (V*3 float32)
    #   [indices]    (F*3 uint32)
    #   [delta_0]    (V*3 float32)
    #   ...
    #   [delta_N-1]  (V*3 float32)
    #   [times]      (N float32)
    #   [weights_0]  (N_targets float32)  — one weight array per keyframe
    #   ...
    #   [weights_N-1]

    bin_parts: list[bytes] = []

    def add(arr: np.ndarray) -> tuple[int, int]:
        """
        Append array bytes (padded) to bin_parts
        """
        raw = pack_with_padding(arr.tobytes())
        offset = sum(len(p) for p in bin_parts)
        bin_parts.append(raw)
        return offset, len(arr.tobytes())

    pos_offset, pos_len = add(base_verts)
    idx_offset, idx_len = add(base_faces)
    delta_offsets, delta_lens = [], []
    for i in range(n_targets):
        o, l = add(deltas[i])
        delta_offsets.append(o)
        delta_lens.append(l)

    time_offset,  time_len  = add(times)

    # Weight array: at frame k, weight for target t = 1 if t == k-1 else 0
    weight_arrays = np.zeros((n_frames, n_targets), dtype=np.float32)
    for k in range(1, n_frames):
        weight_arrays[k, k - 1] = 1.0
    weights_offset, weights_len = add(weight_arrays.reshape(-1))

    blob = b"".join(bin_parts)

    # glTF buffer
    buf = Buffer(byteLength=len(blob))
    gltf.buffers.append(buf)
    gltf.set_binary_blob(blob)

    def add_buffer_view(byte_offset: int, byte_length: int, target=None) -> int:
        bv = BufferView(buffer=0, byteOffset=byte_offset, byteLength=byte_length)
        if target is not None:
            bv.target = target
        idx = len(gltf.bufferViews)
        gltf.bufferViews.append(bv)
        return idx

    def add_accessor(bv_idx: int, component_type: int, count: int,
                     acc_type: str, min_vals=None, max_vals=None) -> int:
        acc = Accessor(
            bufferView=bv_idx,
            byteOffset=0,
            componentType=component_type,
            count=count,
            type=acc_type,
        )
        if min_vals is not None:
            acc.min = [float(v) for v in min_vals]
        if max_vals is not None:
            acc.max = [float(v) for v in max_vals]
        idx = len(gltf.accessors)
        gltf.accessors.append(acc)
        return idx

    V = len(base_verts)
    F = len(base_faces)

    # position accessor
    pos_bv  = add_buffer_view(pos_offset, pos_len, ARRAY_BUFFER)
    pos_acc = add_accessor(pos_bv, FLOAT, V, VEC3,
                           min_vals=base_verts.min(0), max_vals=base_verts.max(0))

    # index accessor
    idx_bv  = add_buffer_view(idx_offset, idx_len, ELEMENT_ARRAY_BUFFER)
    idx_acc = add_accessor(idx_bv, UNSIGNED_INT, F * 3, SCALAR)

    # morph target accessors
    morph_accessors = []
    for i in range(n_targets):
        d = deltas[i]
        bv  = add_buffer_view(delta_offsets[i], delta_lens[i], ARRAY_BUFFER)
        acc = add_accessor(bv, FLOAT, V, VEC3,
                           min_vals=d.min(0), max_vals=d.max(0))
        morph_accessors.append(acc)

    # animation time accessor
    time_bv  = add_buffer_view(time_offset, time_len)
    time_acc = add_accessor(time_bv, FLOAT, n_frames, SCALAR,
                            min_vals=[float(times[0])], max_vals=[float(times[-1])])

    # animation weights accessor
    w_bv  = add_buffer_view(weights_offset, weights_len)
    w_acc = add_accessor(w_bv, FLOAT, n_frames * n_targets, SCALAR)

    # mesh 
    targets = [{"POSITION": acc} for acc in morph_accessors]
    prim = Primitive(
        attributes=Attributes(POSITION=pos_acc),
        indices=idx_acc,
        targets=targets,
    )
    # initial weights: all zero (display frame 0 = base mesh)
    mesh = Mesh(
        primitives=[prim],
        weights=[0.0] * n_targets,
    )
    gltf.meshes.append(mesh)

    # node / scene
    node = Node(mesh=0)
    gltf.nodes.append(node)
    scene = Scene(nodes=[0])
    gltf.scenes.append(scene)
    gltf.scene = 0

    # animation 
    # One channel animates the "weights" of node 0.
    # The sampler maps time → weight vector (all N_targets weights concatenated).
    sampler = AnimationSampler(
        input=time_acc,
        interpolation="LINEAR",
        output=w_acc,
    )
    channel = AnimationChannel(
        sampler=0,
        target=AnimationChannelTarget(node=0, path="weights"),
    )
    anim = Animation(samplers=[sampler], channels=[channel], name="MeshSequence")
    gltf.animations.append(anim)

    return gltf

def main():
    parser = argparse.ArgumentParser(
        description="Convert a PLY mesh sequence to a glTF morph-target animation."
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Glob pattern for input PLY files, e.g. 'meshes/*.ply'",
    )
    parser.add_argument(
        "--output", "-o",
        default="animation/skier.glb",
        help="Output file path (.glb recommended, .gltf also accepted). Default: animation.glb",
    )
    parser.add_argument(
        "--fps", "-f",
        type=float,
        default=60.0,
        help="Frames per second for the animation. Default: 60",
    )
    args = parser.parse_args()

    meshes = load_ply_files(args.input)
    validate_meshes(meshes)

    print(f"\nBuilding glTF with {len(meshes) - 1} morph targets at {args.fps} fps...")
    gltf = build_gltf(meshes, args.fps)

    out = args.output
    if out.endswith(".glb"):
        gltf.save_binary(out)
    else:
        gltf.save(out)

    print(f"Saved to {out}")


if __name__ == "__main__":
    main()