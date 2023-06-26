// using express JS
var express = require("express");
var app = express();

// express formidable is used to parse the form data values
var formidable = require("express-formidable");
app.use(formidable());

// use mongo DB as database
var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;

// the unique ID for each mongo DB document
var ObjectId = mongodb.ObjectId;

// receiving http requests
var httpObj = require("http");
var http = httpObj.createServer(app);

// to encrypt/decrypt passwords
var bcrypt = require("bcrypt");

// to store files
var fileSystem = require("fs");
const path = require('path');


// to start the session
var session = require("express-session");
app.use(session({
    secret: 'secret key',
    resave: false,
    saveUninitialized: false
}));

// define the publically accessible folders
app.use("/public/css", express.static(__dirname + "/public/css"));
app.use("/public/js", express.static(__dirname + "/public/js"));
app.use("/public/img", express.static(__dirname + "/public/img"));
app.use("/public/font-awesome-4.7.0", express.static(__dirname + "/public/font-awesome-4.7.0"));
app.use("/public/fonts", express.static(__dirname + "/public/fonts"));

// using EJS as templating engine
app.set("view engine", "ejs");

// main URL of website
var mainURL = "http://localhost:3001";

// global database object
var database = null;

// app middleware to attach main URL and user object with each request
app.use(function (request, result, next) {
    request.mainURL = mainURL;
    request.isLogin = (typeof request.session.user !== "undefined");
    request.user = request.session.user;

    // continue the request
    next();
});
var fileSystem=require("fs");

// recursive function to get the file from uploaded
function recursiveGetFile (files, _id) {
    var singleFile = null;

    for (var a = 0; a < files.length; a++) {
        const file = files[a];

        // return if file type is not folder and ID is found
        if (file.type != "folder") {
            if (file._id == _id) {
                return file;
            }
        }

        // if it is a folder and have files, then do the recursion
        if (file.type == "folder" && file.files.length > 0) {
            singleFile = recursiveGetFile(file.files, _id);
            // return the file if found in sub-folders
            if (singleFile != null) {
                return singleFile;
            }
        }
    }
}

// function to add new uploaded object and return the updated array
function getUpdatedArray (arr, _id, uploadedObj) {
    for (var a = 0; a < arr.length; a++) {
        // push in files array if type is folder and ID is found
        if (arr[a].type == "folder") {
            if (arr[a]._id == _id) {
                arr[a].files.push(uploadedObj);
                arr[a]._id = ObjectId(arr[a]._id);
            }

            // if it has files, then do the recursion
            if (arr[a].files.length > 0) {
                arr[a]._id = ObjectId(arr[a]._id);
                getUpdatedArray(arr[a].files, _id, uploadedObj);
            }
        }
    }

    return arr;
}

// recursive function to remove the file and return the updated array
function removeFileReturnUpdated(arr, _id) {
    for (var a = 0; a < arr.length; a++) {
        if (arr[a].type != "folder" && arr[a]._id == _id) {
            // remove the file from uploads folder
            try {
                fileSystem.unlinkSync(arr[a].filePath);
            } catch (exp) {
                // 
            }
            // remove the file from array
            arr.splice(a, 1);
            break;
        }

        // do the recursion if it has sub-folders
        if (arr[a].type == "folder" && arr[a].files.length > 0) {
            arr[a]._id = ObjectId(arr[a]._id);
            removeFileReturnUpdated(arr[a].files, _id);
        }
    }

    return arr;
}

// recursive function to search uploaded files
function recursiveSearch (files, query) {
    var singleFile = null;

    for (var a = 0; a < files.length; a++) {
        const file = files[a];

        if (file.type == "folder") {
            // search folder case-insensitive
            if (file.folderName.toLowerCase().search(query.toLowerCase()) > -1) {
                return file;
            }

            if (file.files.length > 0) {
                singleFile = recursiveSearch(file.files, query);
                if (singleFile != null) {
                    // need parent folder in case of files
                    if (singleFile.type != "folder") {
                        singleFile.parent = file;
                    }
                    return singleFile;
                }
            }
        } else {
            if (file.name.toLowerCase().search(query.toLowerCase()) > -1) {
                return file;
            }
        }
    }
}

// recursive function to search shared files
function recursiveSearchShared (files, query) {
    var singleFile = null;

    for (var a = 0; a < files.length; a++) {
        var file = (typeof files[a].file === "undefined") ? files[a] : files[a].file;

        if (file.type == "folder") {
            if (file.folderName.toLowerCase().search(query.toLowerCase()) > -1) {
                return file;
            }

            if (file.files.length > 0) {
                singleFile = recursiveSearchShared(file.files, query);
                if (singleFile != null) {
                    if (singleFile.type != "folder") {
                        singleFile.parent = file;
                    }
                    return singleFile;
                }
            }
        } else {
            if (file.name.toLowerCase().search(query.toLowerCase()) > -1) {
                return file;
            }
        }
    }
}
function recursiveGetFolder (files, _id){
    var singleFile=null;
     for(var a=0;a<files.length;a++){
        const file = files[a];

            //return if file type is folder and ID is found
            if(file.type=="folder"){
                if(file._id == _id){
                    return file;
                }
                //if it has files,then do the recursion
                if(file.files.length>0){
                    singleFile=recursiveGetFolder(file.files, _id);
                    //return the file if found in sub-folders
                    if(singleFile != null){
                        return singleFile;
                    }
                }
            }
        }
}

function getUpdatedArray (arr, _id, uploadedObj) {
    for (var a = 0; a < arr.length; a++) {
        // push in files array if type is folder and ID is found
        if (arr[a].type == "folder") {
            if (arr[a]._id == _id) {
                arr[a].files.push(uploadedObj);
                arr[a]._id = ObjectId(arr[a]._id);
            }

            // if it has files, then do the recursion
            if (arr[a].files.length > 0) {
                arr[a]._id = ObjectId(arr[a]._id);
                getUpdatedArray(arr[a].files, _id, uploadedObj);
            }
        }
    }

    return arr;
}

// function renameSubFolders(arr, oldName, newName) {
//     for (var a = 0; a < arr.length; a++) {
//       if (arr[a].type == "folder") {
//         var pathParts = arr[a].folderPath.split("/");
//         var newPath = "";
  
//         for (var b = 0; b < pathParts.length; b++) {
//           if (pathParts[b] == oldName) {
//             pathParts[b] = newName;
//           }
//           newPath += pathParts[b];
  
//           if (b < pathParts.length - 1) {
//             newPath += "/";
//           }
//         }
  
//         arr[a].folderPath = newPath;
  
//         if (arr[a].files.length > 0) {
//           renameSubFolders(arr[a].files, oldName, newName);
//         }
//       } else {
//         var fileParts = arr[a].filePath.split("/");
//         var newFilePath = "";
  
//         for (var c = 0; c < fileParts.length; c++) {
//           if (fileParts[c] == oldName) {
//             fileParts[c] = newName;
//           }
//           newFilePath += fileParts[c];
  
//           if (c < fileParts.length - 1) {
//             newFilePath += "/";
//           }
//         }
  
//         arr[a].filePath = newFilePath;
//       }
//     }
//   }
  

function renameSubFolders(arr ,oldName, newName) {
    for (var a=0; a<arr.length;a++)
    {
        var pathParts = (arr[a].type == "folder") ? arr[a].folderPath.split("/"):arr[a].filePath.split("/");

        var newPath="";
        for(var b=0; b < pathParts.length ;b++){
            if(pathParts[b]==oldName){
                pathParts[b]=newName;
            }
            newPath += pathParts[b];

            if(b<pathParts.length - 1){
                newPath += "/";
            }
        }
    if(arr[a].type == "folder") {
        arr[a].folderPath = newPath;

        if(arr[a].files.length > 0) {
            renameSubFolders(arr[a].files, _id, newName);
        }
    } else {
        arr[a].filePath = newPath;
    }
 }

}
function renameFolderReturnUpdated(arr, _id, newName) {

    for(var a=0; a<arr.length; a++){
        if(arr[a].type == "folder"){
            if(arr[a]._id == _id) {

                const oldFolderName = arr[a].folderName
                var folderPathParts = arr[a].folderPath.split("/");

                var newFolderPath = "";
                for(var b =0; b<folderPathParts.length; b++){
                    if(folderPathParts[b] == oldFolderName) {
                        folderPathParts[b]=newName;
                    }
                    newFolderPath += folderPathParts[b];
                    if(b<folderPathParts.length - 1){
                        newFolderPath += "/";
                    }
                }

                fileSystem.rename(arr[a].folderPath, newFolderPath, function(error) {
                      //
                });

                arr[a].folderName = newName;
                arr[a].folderPath = newFolderPath;

                renameSubFolders(arr[a].files, oldFolderName, newName);
                break;
            }
            if(arr[a].files.length>0) {
                renameFolderReturnUpdated(arr[a].files, _id, newName);
            }
        }
    }
    return arr;
}

function renameFileReturnUpdated(arr, _id, newName) {
    for(var a=0;a<arr.length;a++){
        if(arr[a].type != "folder"){
            if(arr[a]._id == _id){

                const oldFileName = arr[a].name;
                var filePathParts = arr[a].filePath.split("/");

                var newFilePath = "";
                for(var b =0; b<filePathParts.length; b++){
                    if(filePathParts[b] == oldFileName) {
                        filePathParts[b] = newName;
                    }
                    newFilePath += filePathParts[b];
                    if(b < filePathParts.length - 1){
                        newFilePath += "/";
                    }
                }
            fileSystem.rename(arr[a].filePath, newFilePath, function(error){
             //
            });

            arr[a].name= newName;
            arr[a].filePath = newFilePath;
            break;

        }
    }

    if(arr[a].type == "folder" && arr[a].files.length>0){
        renameFileReturnUpdated(arr[a].files, _id, newName);
    }
}
return arr;
}




                


























// start the http server
http.listen(3001, function () {
    console.log("Server started at " + mainURL);

    // connect with mongo DB server
    mongoClient.connect("mongodb://localhost:27017", {
        useUnifiedTopology: true
    }, function (error, client) {

        // connect database (it will automatically create the database if not exists)
        database = client.db("file_transfer");
        console.log("Database connected.");

        // app.post("/RenameFile",async function(request,result){
        //     const _id = request.fields._id;
        //     const name = request.fields.name;

        //     if (request.session.user){
        //         var user = await database.collection("users").findOne({
        //             "_id": ObjectId(request.session.user._id)
        //         });

        //         var updatedArray = await renameFileReturnUpdated(user.uploaded, _id, name);
        //         for (var a=0; a<updatedArray.length;a++)
        //         {
        //             updatedArray[a]._id=ObjectId(updatedArray[a]._id);
        //         }
                
        //         await database.collection("users").updateOne({
        //             "_id": ObjectId(request.session.user._id)
        //         }, {
        //             $set:{
        //                 "uploaded": updatedArray
        //             }
        //         });

        //         const backURL = request.header('Referer') || '/';
        //         result.redirect(backURL);
        //         return false;
        //     }
        //     result.redirect("/Login");
        // });
        app.post("/RenameFile", async function(request, result) {
            const _id = request.fields._id;
            const name = request.fields.name;
          
            if (request.session.user) {
              var user = await database.collection("users").findOne({
                "_id": ObjectId(request.session.user._id)
              });
          
              var updatedArray = await renameFileReturnUpdated(user.uploaded, _id, name);
              for (var a = 0; a < updatedArray.length; a++) {
                updatedArray[a]._id = ObjectId(updatedArray[a]._id);
              }
          
              await database.collection("users").updateOne({
                "_id": ObjectId(request.session.user._id)
              },{
                $set: {
                  "uploaded": updatedArray
                }
              });
          
              const backURL = request.header('Referer') || '/';
              result.redirect(backURL);
              return false;
            }
            result.redirect("/Login");
          });


        app.post("/RenameFolder",async function (request,result){
            const _id = request.fields._id;
            const name = request.fields.name;

            if(request.session.user) {
                var user = await database.collection("users").findOne({
                    "_id": ObjectId(request.session.user._id)
                });

                var updatedArray = await renameFolderReturnUpdated(user.uploaded, _id, name);
                for(var a=0 ; a<updatedArray.length;a++)
                {
                    updatedArray[a]._id = ObjectId(updatedArray[a]._id);
                }

                await database.collection("users").updateOne({
                    "_id": ObjectId(request.session.user._id)
                },{
                    $set: {
                        "uploaded":updatedArray
                    }
                });
                const backURL = request.header('Referer') || '/';
                result.redirect(backURL);
                return false;
            }
            result.redirect("/Login");
        });








        
        








        app.post("/CreateFolder",async function(request, result){
            const name=request.fields.name;
            const _id = request.fields._id;
            if(request.session.user) {
                var user = await database.collection("users").findOne({
                    "_id":ObjectId(request.session.user._id)
                });
                var uploadedObj = {
                    "_id": ObjectId(),
                    "type": "folder",
                    "folderName": name,
                    "files": [],
                    "folderPath": "",
                    "createdAt": new Date().getTime()
                };

                var folderPath= "";
                var updatedArray = [];
                if(_id == "")
                { 
                    folderPath="public/uploads/"+user.email+"/"+name;
                    uploadedObj.folderPath=folderPath;

                if(!fileSystem.existsSync("public/uploads/"+user.email))
                {
                    fileSystem.mkdirSync("public/uploads/"+user.email);
                }

            } else {
                var folderObj=await recursiveGetFolder(user.uploaded, _id);
                uploadedObj.folderPath=folderObj.folderPath + "/"+name;
                updatedArray=await getUpdatedArray(user.uploaded, _id,uploadedObj);
            }

            if(uploadedObj.folderPath == ""){
                request.session.status="error";
                request.session.message="Folder name must not be empty.";
                result.redirect("/MyUploads");
                return false;
            }

            if(fileSystem.existsSync(uploadedObj.folderPath)){
                request.session.status="error";
                request.session.message="Folder with same name already exists";
                result.redirect("/MyUploads");
                return false;
            }

            fileSystem.mkdirSync(uploadedObj.folderPath);

            if(_id == "") {
                await database.collection("users").updateOne({
                    "_id": ObjectId(request.session.user._id)
                }, {
                    $push: {
                        "uploaded": uploadedObj
                    }
                });
            } else {
                for(var a=0;a < updatedArray.length; a++){
                    updatedArray[a]._id=ObjectId(updatedArray[a]._id);
                }

                await database.collection("users").updateOne({
                    "_id": ObjectId(request.session.user._id)
                }, {
                    $set: {
                        "uploaded": updatedArray
                    }
                    
                    });
                }
                  result.redirect("/MyUploads/"+_id);
                  return false;
                }
                result.redirect("/Login");
            });








        app.get("/MyUploads/:_id?",async function (request, result) {
            const _id=request.params._id;
            if(request.session.user) {

                var user=await database.collection("users").findOne({
                    "_id": ObjectId(request.session.user._id)
                });

                  var uploaded=null;
                  var folderName= "";
                  var createdAt= "";
                  if(typeof _id == "undefined")
                  {
                    uploaded=user.uploaded;
                  } else {
                    var folderObj=await recursiveGetFolder(user.uploaded, _id);

                        if(folderObj == null){
                            request.status="error";
                            request.message="Folder not found";
                            result.render("MyUploads",{
                                "request":request
                            });
                                return false;
                            }

                            uploaded=folderObj.files;
                            folderName=folderObj.folderName;
                            createdAt=folderObj.createdAt;
                        }
                        if(uploaded == null){
                            request.status="error";
                            request.message="Directory not found";
                            result.render("MyUploads",{
                                "request":request
                            });
                            return false;
                        }
                        result.render("MyUploads",{
                            "request":request,
                            "uploaded":uploaded,
                            "_id": _id,
                            "folderName" : folderName,
                            "createdAt": createdAt
                        });
                            return false;
                        }
                        result.redirect("/Login");
                    });





        app.get("/pro-versions", function (request, result) {
            result.render("proVersions", {
                "request": request
            }); 
        });

        app.get("/Admin", async function (request, result) {
            // render an HTML page with number of pages, and posts data
            result.render("Admin", {
                request: request
            });
        });

        // search files or folders
        app.get("/Search", async function (request, result) {
            const search = request.query.search;

            if (request.session.user) {
                var user = await database.collection("users").findOne({
                    "_id": ObjectId(request.session.user._id)
                });
                var fileUploaded = await recursiveSearch(user.uploaded, search);
                var fileShared = await recursiveSearchShared(user.sharedWithMe, search);

                // check if file is uploaded or shared with user
                if (fileUploaded == null && fileShared == null) {
                    request.status = "error";
                    request.message = "File/folder '" + search + "' is neither uploaded nor shared with you.";

                    result.render("Search", {
                        "request": request
                    });
                    return false;
                }

                var file = (fileUploaded == null) ? fileShared : fileUploaded;
                file.isShared = (fileUploaded == null);
                result.render("Search", {
                    "request": request,
                    "file": file
                });

                return false;
            }

            result.redirect("/Login");
        });

        app.get("/Blog", async function (request, result) {
            // render an HTML page with number of pages, and posts data
            result.render("Blog", {
                request: request
            });
        });

        // get all files shared with logged-in user
        app.get("/SharedWithMe/:_id?", async function (request, result) {
            result.render("SharedWithMe", {
                "request": request
            });
        });

        app.post("/DeleteLink", async function (request, result) {

            const _id = request.fields._id;

            if (request.session.user) {
                var link = await database.collection("public_links").findOne({
                    $and: [{
                        "uploadedBy._id": ObjectId(request.session.user._id)
                    }, {
                        "_id": ObjectId(_id)
                    }]
                });

                if (link == null) {
                    request.session.status = "error";
                    request.session.message = "Link does not exists.";

                    const backURL = request.header("Referer") || "/";
                    result.redirect(backURL);
                    return false;
                }

                await database.collection("public_links").deleteOne({
                    $and: [{
                        "uploadedBy._id": ObjectId(request.session.user._id)
                    }, {
                        "_id": ObjectId(_id)
                    }]
                });

                request.session.status = "success";
                request.session.message = "Link has been deleted.";

                const backURL = request.header("Referer") || "/";
                result.redirect(backURL);
                return false;
            }

            result.redirect("/Login");
        });

        app.get("/MySharedLinks", async function (request, result) {
            if (request.session.user) {
                var links = await database.collection("public_links").find({
                    "uploadedBy._id": ObjectId(request.session.user._id)
                }).toArray();

                result.render("MySharedLinks", {
                    "request": request,
                    "links": links
                });
                return false;
            }

            result.redirect("/Login");
        });

        app.get("/SharedViaLink/:hash", async function (request, result) {
            const hash = request.params.hash;

            var link = await database.collection("public_links").findOne({
                "hash": hash
            });

            if (link == null) {
                request.session.status = "error";
                request.session.message = "Link expired.";

                result.render("SharedViaLink", {
                    "request": request
                });
                return false;
            }

            result.render("SharedViaLink", {
                "request": request,
                "link": link
            });
        });

        app.post("/ShareViaLink", async function (request, result) {
            const _id = request.fields._id;

            if (request.session.user) {
                var user = await database.collection("users").findOne({
                    "_id": ObjectId(request.session.user._id)
                });
                var file = await recursiveGetFile(user.uploaded, _id);

                if (file == null) {
                    request.session.status = "error";
                    request.session.message = "File does not exists";

                    const backURL = request.header("Referer") || "/";
                    result.redirect(backURL);
                    return false;
                }

                bcrypt.hash(file.name, 10, async function (error, hash) {
                    hash = hash.substring(10, 20);
                    const link = mainURL + "/SharedViaLink/" + hash;
                    await database.collection("public_links").insertOne({
                        "hash": hash,
                        "file": file,
                        "uploadedBy": {
                            "_id": user._id,
                            "name": user.name,
                            "email": user.email
                        },
                        "createdAt": new Date().getTime()
                    });

                    request.session.status = "success";
                    request.session.message = "Share link: " + link;

                    const backURL = request.header("Referer") || "/";
                    result.redirect(backURL);
                });

                return false;
            }

            result.redirect("/Login");
        });

        // delete uploaded file
        app.post("/DeleteFile", async function (request, result) {
            const _id = request.fields._id;

            if (request.session.user) {
                var user = await database.collection("users").findOne({
                    "_id": ObjectId(request.session.user._id)
                });

                var updatedArray = await removeFileReturnUpdated(user.uploaded, _id);
                for (var a = 0; a < updatedArray.length; a++) {
                    updatedArray[a]._id = ObjectId(updatedArray[a]._id);
                }

                await database.collection("users").updateOne({
                    "_id": ObjectId(request.session.user._id)
                }, {
                    $set: {
                        "uploaded": updatedArray
                    }
                });

                const backURL = request.header('Referer') || '/';
                result.redirect(backURL);
                return false;
            }

            result.redirect("/Login");
        });

        // download file
        app.post("/DownloadFile", async function (request, result) {
            const _id = request.fields._id;

            var link = await database.collection("public_links").findOne({
                "file._id": ObjectId(_id)
            });

            if (link != null) {
                fileSystem.readFile(link.file.filePath, function (error, data) {
                    // console.log(error);

                    result.json({
                        "status": "success",
                        "message": "Data has been fetched.",
                        "arrayBuffer": data,
                        "fileType": link.file.type,
                        // "file": mainURL + "/" + file.filePath,
                        "fileName": link.file.name
                    });
                });
                return false;
            }

            if (request.session.user) {

                var user = await database.collection("users").findOne({
                    "_id": ObjectId(request.session.user._id)
                });

                var fileUploaded = await recursiveGetFile(user.uploaded, _id);
                
                if (fileUploaded == null) {
                    result.json({
                        "status": "error",
                        "message": "File is neither uploaded nor shared with you."
                    });
                    return false;
                }

                var file = fileUploaded;

                fileSystem.readFile(file.filePath, function (error, data) {
                    // console.log(error);

                    result.json({
                        "status": "success",
                        "message": "Data has been fetched.",
                        "arrayBuffer": data,
                        "fileType": file.type,
                        // "file": mainURL + "/" + file.filePath,
                        "fileName": file.name
                    });
                });
                return false;
            }

            result.json({
                "status": "error",
                "message": "Please login to perform this action."
            });
            return false;
        });

        // view all files uploaded by logged-in user
        app.get("/MyUploads", async function (request, result) {
            if (request.session.user) {

                var user = await database.collection("users").findOne({
                    "_id": ObjectId(request.session.user._id)
                });

                var uploaded = user.uploaded;

                result.render("MyUploads", {
                    "request": request,
                    "uploaded": uploaded
                });
                return false;
            }

            result.redirect("/Login");
        });

        // upload new file
        app.post("/UploadFile", async function (request, result) {
            if (request.session.user) {
              var user = await database.collection("users").findOne({
               "_id": ObjectId(request.session.user._id),
         });
 
     if (request.files.file.size > 0) {
       const _id = request.fields._id;
 
 
       var uploadedObj = {
         "_id": ObjectId(),
         "size": request.files.file.size, // in bytes
         "name": request.files.file.name,
         "type": request.files.file.type,
         "filePath": "", // Updated after the file is written
         "createdAt": new Date().getTime(),
       };
 
       var filePath = ""; // File path for root path or folder path
 
       if (_id == "") {
         // File uploaded in root directory
         filePath ="public/uploads/" +user.email +"/" +new Date().getTime() + "-" +request.files.file.name;
 
           uploadedObj.filePath=filePath;
        // uploadedObj.filePath = path.join(folderObj.folderPath, request.files.file.name);

 
         if (!fileSystem.existsSync("public/uploads/" + user.email)) {
           fileSystem.mkdirSync("public/uploads/" + user.email);
         }
 
       // Read the file
       fileSystem.readFile(request.files.file.path, function (err, data) {
         if (err) throw err;
         console.log('File Read!');
 
           fileSystem.writeFile(filePath,data,async function(err){
            if(err) throw err;
            console.log('File Written!');

          await database.collection("users").updateOne(
            { "_id": ObjectId(request.session.user._id)

          },{
            $push:{

                "uploaded":uploadedObj
            }
        });
        result.redirect("/MyUploads/"+ _id);
    });
        // Delete the temporary file
        fileSystem.unlink(request.files.file.path, function (err) {
          if (err) throw err;
          console.log("File deleted!");
        });
      });
    } else {
     var folderObj=await recursiveGetFolder(user.uploaded, _id);
     uploadedObj.filePath=folderObj.folderPath+ "/"+request.files.file.name;

     var updatedArray=await getUpdatedArray(user.uploaded,_id,uploadedObj);
           fileSystem.readFile(request.files.file.path,function(err,data){
            if(err) throw err;
            console.log('File read!');
            fileSystem.writeFile(uploadedObj.filePath,data,async function(err){
                if(err) throw err;
                console.log('File Written!');


                for(var a=0;a<updatedArray.length;a++)
                {
                    updatedArray[a]._id=ObjectId(updatedArray[a]._id);
                }
                await database.collection("users").updateOne(
                    { "_id": ObjectId(request.session.user._id)
        
                  },{
                    $set:{
        
                        "uploaded":updatedArray
                    }
                });
                result.redirect("/MyUploads/"+ _id);
            });
            fileSystem.unlink(request.files.file.path, function (err) {
                if (err) throw err;
                console.log("File deleted!");
              });
            });
        }
    }else {
        request.status="error";
        request.message="please select a valid image";

        result.render("MyUploads",{
            "request":request,
           
        });
    }
   return false;
           }
           result.redirect("/Login");
        });




// app.post("/UploadFile", async function (request, result) {
//     if (request.session.user) {
//       var user = await database.collection("users").findOne({
//         "_id": ObjectId(request.session.user._id),
//       });
  
//       if (request.files.file.size > 0) {
//         const folderId = request.fields.folderId;
  
//         var uploadedObj = {
//           "_id": ObjectId(),
//           "size": request.files.file.size, // in bytes
//           "name": request.files.file.name,
//           "type": request.files.file.type,
//           "filePath": "", // Updated after the file is written
//           "createdAt": new Date().getTime(),
//         };
  
//         var filePath = ""; // File path for root path or folder path
  
//         if (folderId == "") {
//           // File uploaded in root directory
//           filePath = "public/uploads/" + user.email + "/" + new Date().getTime() + "-" + request.files.file.name;
//           uploadedObj.filePath = filePath;
  
//           if (!fileSystem.existsSync("public/uploads/" + user.email)) {
//             fileSystem.mkdirSync("public/uploads/" + user.email);
//           }
//         } else {
//           var folderObj = await recursiveGetFolder(user.uploaded, folderId);
//           if (folderObj) {
//             filePath = "public/uploads/" + user.email + folderObj.folderPath + "/" + request.files.file.name;
//             uploadedObj.filePath = filePath;
//           } else {
//             // Handle the case where the folder is not found
//             console.log("Folder not found!");
//             result.redirect("/MyUploads"); // Redirect to root directory
//             return;
//           }
//         }
  
//         // Read the file
//         fileSystem.readFile(request.files.file.path, function (err, data) {
//           if (err) throw err;
//           console.log('File read!');
  
//           // Write the file
//           fileSystem.writeFile(filePath, data, async function (err) {
//             if (err) throw err;
//             console.log('File written!');
  
//             if (folderId == "") {
//               user.uploaded.push(uploadedObj);
//             } else {
//               var folderToUpdate = findFolderById(user.uploaded, folderId);
//               if (folderToUpdate) {
//                 folderToUpdate.files.push(uploadedObj);
//               } else {
//                 // Handle the case where the folder to update is not found
//                 console.log("Folder to update not found!");
//                 result.redirect("/MyUploads"); // Redirect to root directory
//                 return;
//               }
//             }
  
//             await database.collection("users").updateOne(
//               { "_id": ObjectId(request.session.user._id) },
//               {
//                 $set: {
//                   "uploaded": user.uploaded,
//                 },
//               }
//             );
  
//             result.redirect("/MyUploads/" + folderId); // Redirect to the folder page
//           });
  
//           // Delete the temporary file
//           fileSystem.unlink(request.files.file.path, function (err) {
//             if (err) throw err;
//             console.log('File deleted!');
//           });
//         });
//       } else {
//         request.status = "error";
//         request.message = "Please select a valid file.";
  
//         result.render("MyUploads", {
//           "request": request,
//         });
//       }
  
//       return false;
//     }
  
//     result.redirect("/Login");
//   });
  
  
// app.post("/UploadFile", async function (request, result) {
//     if (request.session.user) {
//       var user = await database.collection("users").findOne({
//         "_id": ObjectId(request.session.user._id),
//       });
  
//       if (request.files.file.size > 0) {
//         const _id = request.fields._id;
  
//         var uploadedObj = {
//           "_id": ObjectId(),
//           "size": request.files.file.size, // in bytes
//           "name": request.files.file.name,
//           "type": request.files.file.type,
//           "filePath": "", // Updated after the file is written
//           "createdAt": new Date().getTime(),
//         };
  
//         var filePath = ""; // File path for root path or folder path
  
//         if (_id == "") {
//           // File uploaded in root directory
//           filePath = "public/uploads/" + user.email + "/" + new Date().getTime() + "-" + request.files.file.name;
  
//           uploadedObj.filePath = filePath;
  
//           if (!fileSystem.existsSync("public/uploads/" + user.email)) {
//             fileSystem.mkdirSync("public/uploads/" + user.email);
//           }
  
//           // Read the file
//           fileSystem.readFile(request.files.file.path, function (err, data) {
//             if (err) throw err;
//             console.log('File Read!');
  
//             fileSystem.writeFile(filePath, data, async function (err) {
//               if (err) throw err;
//               console.log('File Written!');
  
//               await database.collection("users").updateOne(
//                 { "_id": ObjectId(request.session.user._id) 
//             },{
//                   $push: {
//                     "uploaded": uploadedObj
//                   }
                
//                 });
//               result.redirect("/MyUploads/" + _id);
//             });
  
//             // Delete the temporary file
//             fileSystem.unlink(request.files.file.path, function (err) {
//               if (err) throw err;
//               console.log("File deleted!");
//             });
//           });
//         } else {
//           var folderObj = await recursiveGetFolder(user.uploaded, _id);
//           uploadedObj.filePath = folderObj.folderPath + "/" + request.files.file.name;
  
//           var updatedArray = await getUpdatedArray(user.uploaded, _id, uploadedObj);
  
//           fileSystem.readFile(request.files.file.path, function (err, data) {
//             if (err) throw err;
//             console.log('File read!');
  
//             fileSystem.writeFile(uploadedObj.filePath, data, async function (err) {
//               if (err) throw err;
//               console.log('File Written!');
  
//               for (var a = 0; a < updatedArray.length; a++) {
//                 updatedArray[a]._id = ObjectId(updatedArray[a]._id);
//               }
  
//               await database.collection("users").updateOne(
//                 { "_id": ObjectId(request.session.user._id) },
//                 {
//                   $set: {
//                     "uploaded": updatedArray
//                   }
//                 }
//               );
//               result.redirect("/MyUploads/" + _id);
//             });
  
//             fileSystem.unlink(request.files.file.path, function (err) {
//               if (err) throw err;
//               console.log("File deleted!");
//             });
//           });
//         }
//       } else {
//         request.status = "error";
//         request.message = "Please select a valid image.";
  
//         result.render("MyUploads", {
//           "request": request
//         });
//       }
//       return false;
//     }
//     result.redirect("/Login");
//   });
  

        // logout the user
        app.get("/Logout", function (request, result) {
            request.session.destroy();
            result.redirect("/");
        });

        // show page to login
        app.get("/Login", function (request, result) {
            result.render("Login", {
                "request": request
            });
        });

        // authenticate the user
        app.post("/Login", async function (request, result) {
            var email = request.fields.email;
            var password = request.fields.password;

            var user = await database.collection("users").findOne({
                "email": email
            });

            if (user == null) {
                request.status = "error";
                request.message = "Email does not exist.";
                result.render("Login", {
                    "request": request
                });
                
                return false;
            }

            bcrypt.compare(password, user.password, function (error, isVerify) {
                if (isVerify) {
                    request.session.user = user;
                    result.redirect("/");

                    return false;
                }

                request.status = "error";
                request.message = "Password is not correct.";
                result.render("Login", {
                    "request": request
                });
            });
        });

        // register the user
        app.post("/Register", async function (request, result) {

            var name = request.fields.name;
            var email = request.fields.email;
            var password = request.fields.password;
            var reset_token = "";
            var isVerified = true;
            var verification_token = new Date().getTime();

            var user = await database.collection("users").findOne({
                "email": email
            });

            if (user == null) {
                bcrypt.hash(password, 10, async function (error, hash) {
                    await database.collection("users").insertOne({
                        "name": name,
                        "email": email,
                        "password": hash,
                        "reset_token": reset_token,
                        "uploaded": [],
                        "sharedWithMe": [],
                        "isVerified": isVerified,
                        "verification_token": verification_token
                    }, async function (error, data) {

                        request.status = "success";
                        request.message = "Signed up successfully. You can login now.";

                        result.render("Register", {
                            "request": request
                        });
                        
                    });
                });
            } else {
                request.status = "error";
                request.message = "Email already exist.";

                result.render("Register", {
                    "request": request
                });
            }
        });

        // show page to do the registration
        app.get("/Register", function (request, result) {
            result.render("Register", {
                "request": request
            });
        });

        // home page
        app.get("/", function (request, result) {
            result.render("index", {
                "request": request
            });
        });
    });
});