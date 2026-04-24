"""
Usage:

save_mhr_params(
    outputs=mask_output, 
    save_dir=f"{self.OUTPUT_DIR}/hmr_4d_individual", 
    image_path=image_path,
    id_current=id_current,
)
"""

import json
import torch
import numpy as np

# Probably integrate it as part of app.py so don't need to save .json files
def save_mhr_params(
    outputs: List[Dict[str, Any]],
    save_dir: str,
    image_path: str,
    id_current: List,
):
    """Save MHR parameters at each frame to a .json file"""
    
    if outputs is None:
        return

    # keys_to_save = ["mhr_model_params", "pred_cam_t", "focal_length"] 
    keys_to_save = ["mhr_model_params"] 

    for person_id, person_output in enumerate(outputs): 

        dict_to_save = {}
        for key in keys_to_save:
            
            value = outputs.get[key]
            if torch.is_tensor(val):
                dict_to_save[key] = value.detach().cpu().numpy().tolist()
            elif isinstance(value, np.ndarray):
                dict_to_save[key] = val.tolist()
            else:
                dict_to_save[key] = value
    
        with open(f"{save_dir}/{pid+1}/{os.path.basename(image_path)[:-4]}.json", "w") as f:
            json.dump(dict_to_save, f, indent=4)