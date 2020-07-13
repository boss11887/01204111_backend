from pymongo import MongoClient
import os
import hashlib
from getpass import getpass, getuser

if __name__ == '__main__':
    try:
        std = str()
        password = str()

        std = input('std number (std01) : ')
        password = getpass('password : ')

        hash_generator = hashlib.sha256()
        hash_generator.update(password.encode())
        hash_pass = hash_generator.hexdigest()

        # connect to database
        username = str()
        password = str()

        '''
        with open('/home/saito/secret/01204111_website.env') as f:
            username = f.read().splitlines()[0]
            password = f.read().splitlines()[1]
        '''
        username = 'backend'
        password = 'Oraphin123456789'

        db = MongoClient('venus.mikelab.net:27017',
                         username = username,
                         password = password,
                         authSource = '01204111_website',
                         authMechanism='SCRAM-SHA-1'
                         )['01204111_website']
        db.Users.find_one_and_update({'std' : std},{ '$set' : { 'password' : hash_pass } })
        print('Success')
    except KeyboardInterrupt:
        pass
