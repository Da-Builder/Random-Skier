from pygltflib import *
import trimesh
import numpy as np
import glob



# --- Setup ---

ply_files = sorted(glob.glob("out/*.ply"))
meshes = [trimesh.load(f) for f in ply_files]
base = meshes[0]
base_verts = np.array(base.vertices, dtype=np.float32)
base_faces = np.array(base.faces, dtype=np.uint32)
targets = [np.array(m.vertices, dtype=np.float32) - base_verts for m in meshes[1:]]

n_frames = len(meshes)
fps = 30.0
times = np.array([i / fps for i in range(n_frames)], dtype=np.float32)

# At each frame, only one morph target is fully active (1.0) and rest are 0.0
# Shape is (n_frames, n_targets) — one row per keyframe
n_targets = len(targets)
weights = np.zeros((n_frames, n_targets), dtype=np.float32)
for i in range(1, n_frames):
    weights[i, i - 1] = 1.0  # frame i activates morph target i-1

gltf = GLTF2()
buffer_data = b""



# --- Write glTF ---

def add_buffer_view(data, target=None):
    offset = len(buffer_data)
    bv = BufferView(buffer=0, byteOffset=offset, byteLength=len(data))
    if target:
        bv.target = target
    gltf.bufferViews.append(bv)
    return len(gltf.bufferViews) - 1

def add_accessor(bv_idx, comp_type, count, acc_type, min_vals=None, max_vals=None):
    acc = Accessor(
        bufferView=bv_idx,
        componentType=comp_type,
        count=count,
        type=acc_type,
    )
    if min_vals: acc.min = min_vals
    if max_vals: acc.max = max_vals
    gltf.accessors.append(acc)
    return len(gltf.accessors) - 1

# --- Base geometry ---
verts_bytes = base_verts.tobytes()
bv_verts = add_buffer_view(verts_bytes, target=34962)
buffer_data += verts_bytes
acc_verts = add_accessor(bv_verts, FLOAT, len(base_verts), VEC3,
    min_vals=base_verts.min(axis=0).tolist(),
    max_vals=base_verts.max(axis=0).tolist())

faces_bytes = base_faces.tobytes()
bv_faces = add_buffer_view(faces_bytes, target=34963)
buffer_data += faces_bytes
acc_faces = add_accessor(bv_faces, UNSIGNED_INT, base_faces.size, SCALAR)

# --- Morph target deltas ---
target_accessors = []
for t in targets:
    tb = t.tobytes()
    bv = add_buffer_view(tb, target=34962)
    buffer_data += tb
    acc = add_accessor(bv, FLOAT, len(t), VEC3,
        min_vals=t.min(axis=0).tolist(),
        max_vals=t.max(axis=0).tolist())
    target_accessors.append(acc)

# --- Animation: time input ---
times_bytes = times.tobytes()
bv_times = add_buffer_view(times_bytes)
buffer_data += times_bytes
acc_times = add_accessor(bv_times, FLOAT, len(times), SCALAR,
    min_vals=[float(times[0])],
    max_vals=[float(times[-1])])

# --- Animation: weights output ---
# pygltflib expects flat array: (n_frames * n_targets,)
weights_flat = weights.flatten().astype(np.float32)
weights_bytes = weights_flat.tobytes()
bv_weights = add_buffer_view(weights_bytes)
buffer_data += weights_bytes
acc_weights = add_accessor(bv_weights, FLOAT, len(weights_flat), SCALAR)

# --- Mesh with morph targets ---
mesh = Mesh(
    primitives=[Primitive(
        attributes=Attributes(POSITION=acc_verts),
        indices=acc_faces,
        targets=[{"POSITION": target_accessors[i]} for i in range(n_targets)]
    )],
    weights=[0.0] * n_targets  # initial influences all zero
)
gltf.meshes.append(mesh)

node = Node(mesh=0)
gltf.nodes.append(node)
gltf.scenes.append(Scene(nodes=[0]))
gltf.scene = 0

# --- Animation clip ---
sampler = AnimationSampler(
    input=acc_times,
    interpolation="LINEAR",
    output=acc_weights
)
# Target node=0, path="weights" drives morphTargetInfluences
channel = AnimationChannel(
    sampler=0,
    target=AnimationChannelTarget(node=0, path="weights")
)
gltf.animations.append(Animation(
    name="MorphSequence",
    samplers=[sampler],
    channels=[channel]
))

# --- Buffer ---
import base64
b64 = base64.b64encode(buffer_data).decode("utf-8")
gltf.buffers.append(Buffer(
    uri=f"data:application/octet-stream;base64,{b64}",
    byteLength=len(buffer_data)
))

gltf.save("animation/skier1.glb")
print(f"Exported {n_frames} frames, {n_targets} morph targets, duration {times[-1]:.2f}s")