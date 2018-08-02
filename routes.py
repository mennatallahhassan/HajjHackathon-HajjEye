# -*- coding: utf-8 -*-
import sys, math
from flask import Flask, render_template, redirect, url_for, flash, request,session, make_response, jsonify
import ast, json
# import requests
from app import app,log
from config import get_verify_token
import traceback,os, requests
import random
# import apiai

# CLIENT_ACCESS_TOKEN = 'b6cd44b715414f3889ed19d4d7046064'

# ai = apiai.ApiAI(CLIENT_ACCESS_TOKEN)


@app.route('/webhook', methods=['POST'])
def handle_messages():
    # requestAI = ai.text_request()
    # requestAI.query = response
    # response = json.loads(requestAI.getresponse().read())
    # # print('Response is ',response)
    # result = response['result']['fulfillment']['speech']
    req = request.get_json(silent=True, force=True)
    try:
        action = req.get('queryResult').get('action')
    except AttributeError:
        return 'json error'

    if action == 'need_volunteer':
        res = need_vlounteer(req)
    else:
        res = 'Uknown Action'
    
    return make_response(jsonify({'fulfillmentText': res}))

def need_vlounteer(req):
    print('req issssss',req)
    # get the response
    return "You'll be connected with a volunteer soon."
    