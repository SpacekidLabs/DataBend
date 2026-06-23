import sys
import json
import argparse
import traceback
from pedalboard import load_plugin
from pedalboard.io import AudioFile

def scan_params(plugin_path):
    try:
        vst = load_plugin(plugin_path)
        params = {}
        for name, param in vst.parameters.items():
            try:
                # Basic types handling (usually float for parameters)
                params[name] = {
                    "label": param.name,
                    "type": "slider",
                }
                
                # Check for default
                # (Some plugins might expose string values, etc., but DataBand uses mostly 0-1 sliders)
                # Pedalboard params usually have `default_value`
                if hasattr(param, 'default_value'):
                    params[name]['defaultValue'] = param.default_value
                else:
                    params[name]['defaultValue'] = 0.5
                    
                if hasattr(param, 'min_value') and param.min_value is not None and not isinstance(param.min_value, bool):
                    params[name]['min'] = float(param.min_value)
                else:
                    params[name]['min'] = 0.0
                    
                if hasattr(param, 'max_value') and param.max_value is not None and not isinstance(param.max_value, bool):
                    params[name]['max'] = float(param.max_value)
                else:
                    params[name]['max'] = 1.0
                    
                # Small step
                params[name]['step'] = (params[name]['max'] - params[name]['min']) / 100.0
            except Exception:
                pass
        
        print(json.dumps({"success": True, "params": params}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}))

def process_audio(plugin_path, params_json, in_wav, out_wav):
    try:
        vst = load_plugin(plugin_path)
        params = json.loads(params_json)
        
        for name, value in params.items():
            if hasattr(vst, name):
                setattr(vst, name, float(value))
                
        with AudioFile(in_wav) as f:
            audio = f.read(f.frames)
            samplerate = f.samplerate
            
        processed = vst(audio, samplerate, reset=True)
        
        with AudioFile(out_wav, 'w', samplerate, processed.shape[0]) as f:
            f.write(processed)
            
        print(json.dumps({"success": True}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--scan', type=str, help='Path to plugin to scan')
    parser.add_argument('--process', type=str, help='Path to plugin to process')
    parser.add_argument('--params', type=str, help='JSON string of params to apply')
    parser.add_argument('--in', dest='in_file', type=str, help='Input wav')
    parser.add_argument('--out', dest='out_file', type=str, help='Output wav')
    
    args = parser.parse_args()
    
    if args.scan:
        scan_params(args.scan)
    elif args.process and args.params and args.in_file and args.out_file:
        process_audio(args.process, args.params, args.in_file, args.out_file)
    else:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
