'use strict'

var jsonfile = require('jsonfile');
const fs = require('fs')
const readChunk = require('read-chunk')
const fileType = require('file-type')

var parent = '/home/lacomm_m/Images/'
var data = {}
data.table = []
var tab = {}
tab.table = []
var result = ""

fs.readdir(parent, (err, files) => {
  files.forEach(function(file) {
    if (file[0] != '.') {
      var save = file
      if (fs.statSync(parent + file).isDirectory()) {
        var buffer = null
      }
      else {
              var buffer = readChunk.sync(parent+save, 0, 4100)
      }
      while (file != '\0' && result != null)
      {
       result = file.match('((?:\\[[^\\]]+\\])|(?:\\([^\\)]+\\))|(?:\\w+))')
       if (result == null) {}
       else {
         tab.table.push(result[0])
         file = file.replace(result[0], '\0')
	 if (buffer != null) {
         	var jsondata = {
		   name:save,
		   MimeType:fileType(buffer),
		   NameGroups:tab.table,
		   ParentDirectories:parent
		 }
	       }
        }
      }
      data.table.push(jsondata)
      tab.table = []
      result = ""
    }
  })
  fs.writeFile("input.json", JSON.stringify(data, null, 2), function(err) {
    if (err) throw err
    console.log('complete')
  })
})
