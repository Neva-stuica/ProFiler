#!/usr/bin/env node
'use strict'

/*
 * TREE
 */
var jsonfile = require('jsonfile');
const fs = require('fs')
const readChunk = require('read-chunk')
const fileType = require('file-type')

var parent = './'
var data = {}
data.file_list = []
var tab = {}
tab.file_list = []
var result = ""

let p = new Promise(function (res, rej) {fs.readdir(parent, (err, files) => {
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
         tab.file_list.push(result[0])
         file = file.replace(result[0], '\0')
	 if (buffer != null) {
         	var jsondata = {
		   name:save,
		   MimeType:fileType(buffer),
		   NameGroups:tab.file_list,
		   ParentDirectories:parent
		 }
	       }
        }
      }
      data.file_list.push(jsondata)
      tab.file_list = []
      result = ""
    }
  })
  fs.writeFile("sample.json", JSON.stringify(data, null, 2), function(err) {
    if (err) throw err
    console.log('complete')
  res()
  })
})})


/*
 * SORTING
 */

p.then(function() {
const algolia = require('algoliasearch')
const client = algolia('5JG9JQ2ICJ', '8c048a4fd25b040d99fc429e8f66f3e3')
const index = client.initIndex('sample');
const database = require('./sample.json')

function clone(obj) {
	if (null == obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
}

function k_combinations(set, k) {
	var i, j, combs, head, tailcombs;

	if (k > set.length || k <= 0) {
		return [];
	}

	if (k == set.length) {
		return [set];
	}

	if (k == 1) {
		combs = [];
		for (i = 0; i < set.length; i++) {
			combs.push([set[i]]);
		}
		return combs;
	}

	combs = [];
	for (i = 0; i < set.length - k + 1; i++) {
		head = set.slice(i, i + 1);
		tailcombs = k_combinations(set.slice(i + 1), k - 1);
		for (j = 0; j < tailcombs.length; j++) {
			combs.push(head.concat(tailcombs[j]));
		}
	}
	return combs;
}

function combinations(set) {
	var k, i, combs, k_combs;
	combs = [];

	for (k = 1; k <= set.length; k++) {
		k_combs = k_combinations(set, k);
		for (i = 0; i < k_combs.length; i++) {
			combs.push(k_combs[i]);
		}
	}
	return combs;
}

function remove(tagged, tags, list) {
	let arr

	for (let i in list) {
		for (let j = list[i].length - 1; j >= 0; --j) {
			if (list[i][j][0] === tags) {
				for (let k = tagged.length - 1; k >= 0; --k) {
					let index = list[i][j][2].indexOf(tagged[k])
					if (index !== -1) {
						list[i][j][2].splice(index, 1)
					}
				}
				list[i][j][1] = list[i][j][2].length
				if (!list[list[i][j][1]])
					list[list[i][j][1]] = []
				list[list[i][j][1]].push(list[i][j])
				list[i].splice(j, 1)
			}
		}
	}
}

function intersection(a, b) {
	let c = [];
	let j = 0;

	for (let i = 0; i < a.length; ++i)
		if (b.indexOf(a[i]) != -1)
			c[j++] = a[i];
	return c
}

function relist(list, tagged=undefined) {
    let rlist = {}
	let map = list

	if (tagged) {
		map = []
		for (let i in list)
			map = map.concat(list[i])
	}

	for (let i in map) {
		let intersect
		if (tagged)
			intersect = intersection(tagged, map[i][2])
		else
			intersect = map[i][2]

		if (!rlist[intersect.length])
			rlist[intersect.length] = []
		rlist[intersect.length].push([map[i][0], intersect.length, intersect])
	}
	return rlist
}

function hasConflict(a, b) {
	let aNInB = false
	let bNInA = false
	let aInB = false
	let bInA = false

	for (let i in a) {
		if (b.indexOf(a[i]) === -1)
			aNInB = true
		else
			aInB = true
	}
	for (let i in b) {
		if (a.indexOf(b[i]) === -1)
			bNInA = true
		else
			bInA = true
	}
	return aNInB && bNInA && aInB && bInA
}

function contains(a, b) {
	for (let i in b)
		if (a.indexOf(b[i]) === -1)
			return false
	return true
}

function same(a, b) {
	if (a.length !== b.length)
		return false
	for (let i in b)
		if (a.indexOf(b[i]) === -1)
			return false
	return true
}

function abort(e) {
	if (e) {
		console.log(e)
		process.exit(0)
	}
}

function overwrite(json) {
	index.addObjects(json, function (err, content) {
		console.log(content)
		if (err) {
			console.log('ERROR')
			console.log(err)
		}
	})
	index.setSettings({
		searchableAttributes: ['MimeType', 'NameGroups'],
		attributesForFaceting: ['NameGroups']
	})
}

overwrite(database.file_list)


let mapped = new Promise(function (resolve, reject) {
	index.search('', {facets: ['NameGroups']}, function (e, d) {
		let facetsPromises = []
		let associationMap = {}

		abort(e)
		for (let facet in d.facets.NameGroups) {
			facetsPromises.push(new Promise(function (res, rej) {
				index.search(facet, {attributesToRetrieve: ['objectID']}, function (e, d) {
					let ids = []

					abort(e)
					for (let id in d.hits)
						ids.push(d.hits[id].objectID)
					res([facet, ids.length, ids])
				})
			}))
		}

		Promise.all(facetsPromises).then(function (ids){
			resolve(ids)
		})
	})
})

mapped.then(function (map) {
	map = map.sort(function (a, b) { return b[1] - a[1] })
	let maxScale = map[0][1] + 1
	let list = relist(map)
	let tree = []

	while (0 <-- maxScale) {
		while (list[maxScale] && list[maxScale].length) {
			let sibling = list[maxScale]
			let tagged = sibling[0][2].slice()
			let conflict = false

			if (sibling[0][2].length < 2) {
				list[maxScale].splice(0, 1)
				continue
			}

			let i = list[maxScale].length
			while (i--) {
				let brother = list[maxScale][i]
				if (hasConflict(brother[2], tagged)) {
					list[maxScale].splice(i, 1)
					conflict = true
				}
			}
			if (conflict) {
				list[maxScale].splice(0, 1)
				continue
			}


			/*
			 * Searching for subdirs...
			 */

			function recursive(sublist, tagged, j) {
				if (!j)
					return undefined

				sublist = relist(sublist, tagged)
				if (!sublist[j]) {
					return recursive(sublist, tagged, j - 1)
				}

				let i = sublist[j].length
				let fullName
				let name = []
				let result = {children: []}

				while (i--) {
					let brother = sublist[j][i]
					if (same(tagged, brother[2])) {
						name.push(brother[0])
						sublist[j].splice(i, 1)
						remove(tagged, brother[0], list)
						remove(tagged, brother[0], sublist)
					}
				}

				result.name = name.join(' ')

				i = sublist[j].length
				let contained = []
				while (i--) {
					let brother = sublist[j][i]
					if (contains(tagged, brother[2]))
						contained.push(clone(brother))
				}

				contained = combinations(contained)
				let validGroups = []
				for (let group in contained) {
					let conflict = false
					for (let e in contained[group]) {
						for (let f in contained[group]) {
							if (hasConflict(contained[group][e][2], contained[group][f][2])) {
								conflict = true
								break
							}
						}
						if (conflict)
							break
					}
					if (!conflict)
						validGroups.push(clone(contained[group]))
				}
				validGroups = validGroups.sort(function (a, b) { return b.length - a.length })
				for (let child in validGroups[0]) {
					let obj = {name: validGroups[0][child][0]}
					let _children = recursive(sublist, validGroups[0][child][2], j - 1)
					if (_children && _children.children)
						obj.children = _children.children
					result.children.push(obj)
					remove(tagged, validGroups[0][child][0], list)
					remove(tagged, validGroups[0][child][0], sublist)
				}
				let _children = recursive(sublist, tagged, j - 1)
				if (_children)
					result.children = result.children.concat(_children.children)
				for (let _i = result.children.length; _i; --_i) {
					for (let _j = result.children.length; _j; --_j) {
						if (!result.children[_i - 1])
							continue
						if (result.children[_i - 1] && result.children[_i - 1].children &&
							JSON.stringify(result.children[_i - 1].children).indexOf(`"${result.children[_j - 1].name}"`) !== -1)
							result.children.splice(_j - 1, 1)
					}
				}
				return clone(result)
			}

			tree.push(recursive(list, tagged, maxScale))
			console.error(JSON.stringify(tree, null, 2))
		}
	}

	function parseTree(pre, t) {
		for (let i in t) {
			let dir = t[i]
			let tmp = clone(pre)
			tmp.push(dir.name)
			console.log(`Creating dir ${dir.name}`)
			if (!fs.existsSync('./' + tmp.join('/')))
				fs.mkdirSync('./' + tmp.join('/'))

			parseTree(clone(tmp), dir.children)
			let p = new Promise(function (res, rej) {
				index.search(tmp.join(' '), function (e, d) {
					abort(e)
					if (!d.moved)
						fs.rename(d.path, './' + tmp.join('/') + '/' + d.filename, abort)
					res(d)
				})
			})
			p.then(function(o) {
				if (!d.moved) {
					d.moved = true
					index.saveObjects(d, function (e, d) { abort(e) })
				}
			})
		}
	}

	parseTree([], tree)
})
})
