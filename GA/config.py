import os

def get_verify_token():
    return os.environ.get('VERIFY_TOKEN', 'Very_Secret_Token')
