#what program need ot do
import json
from profile import CandidateProfile
from prompt import build_system_prompt
# open candidate
# read it
# parse it
# if succeds confirm
#     if not KeyError

try:
    with open(r"C:\knome\backend\candidate.json", "r") as file:
        data = json.load(file)

    print('JSON is valid')

except (FileNotFoundError , json.JSONDecodeError):
    print("not valid")

valid_data = CandidateProfile(**data)

profile_dict = valid_data.model_dump(mode="json")

prompt = build_system_prompt(profile_dict)

print(prompt)