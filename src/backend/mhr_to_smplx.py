import json
import torch
import smplx
from mhr.mhr import MHR
from smpl_mhr import Conversion

def mhr_to_smplx(mhr_json_path: str, smplx_path:str):

    # Load the .json file and load the parameters
    with open(mhr_json_path, 'r') as f:
        mhr_dict = json.load(f)
    
    mhr_params = {}
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    for key, value in mhr_dict["mhr_model_parameters"].items():
        if isinstance(value, (list, float)):
            mhr_params[key] = torch.tensor(value).float().to(device)
        else:
            mhr_params[key] = value
    
    
    # Initialise models
    mhr_model = MHR.from_files(lod=1, device="cuda")
    smplx_model = smplx.SMPLX(model_path=smplx_path, gender="neutral")
    
    # Initialise converter
    converter = Conversion(
        mhr_model=mhr_model, 
        smpl_model=smplx_model, 
        method="pytorch"  # Use "pytorch" for GPU speed or "pymomentum" for CPU
    )
    
    # Convert MHR to SMPLX
    result = converter.convert_mhr2smpl(
        mhr_parameters=mhr_params,
        return_smpl_meshes=True,
        return_smpl_parameters=True
    )

    return result