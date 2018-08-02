from flask import Flask, render_template, redirect, url_for, flash, request


app = Flask(__name__)
app.config['SECRET_KEY'] = 'Very_Secret_Token'
log = app.logger

from routes import *

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
