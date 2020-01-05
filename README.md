# ScreenDoorWidget

This is a web widget that displays the last post on a firebase account and how long ago it was posted.

**NOTE: THE FIREBASE RULES BELOW ALLOW ANYONE TO READ YOUR DATA. IT ONLY PROTECTS AGAINST WRITING**

## Firebase Setup:
* Go to https://console.firebase.google.com/
* Add a project
* Dashboard -> Project settings -> Add Firebase to your web app. **Note the fields in between the curly braces for later**
* Dashboard -> Authentication -> Sign in method -> Email/Password -> Enable
* Dashboard -> Authentication -> Users -> Add user -> **Note username and password for later**
* Dashboard -> Database -> Create database (locked mode) #This creates a Firestore database which we won't be using
* Every time you go to the databse tab from the dashboard, select Realtime Database at the top instead of Firestore
* Dashboard -> Database  -> Rules -> Publish the following rules:
```
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "true",
        ".write": "$uid === auth.uid",
        "posts": {
        ".indexOn": "timePosted",
          "$postID": {
          	".validate": "newData.hasChildren(['text', 'timePosted', 'uuid']) &&
          	    newData.child('text').isString() &&
                    newData.child('timePosted').isNumber() &&
                    newData.child('uuid').isString()"
          }
        },
        "lastHeartbeat": {
          ".validate": "newData.isNumber()"
        }
      }
    }
  }
}
```
* Post a message to your database with a command similar to the following (or just make the post with sdoor):
```firebase.database().ref(`/users/${currentUser.uid}/posts/${newPost.uuid}`).set(newPost)```
* Look at the new data in your Firebase databse **Note the user id under the /users/ directory for later**

## Configuration
* Go to sdoor.js and add your Firebase Configuration object that was obtained earlier as well as your Firebase user ID

## Testing on local web server
* Install python 3
* Start the web server: python -m http.server 8000
* Open up http://localhost:8000/ in your web browser
