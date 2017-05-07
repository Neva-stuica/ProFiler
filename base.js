if (process.argv.length <= 2) {
	console.log('USAGE\n\tinode base.js [--help] str\n\n\tstr\tPath to the directory to sort')
	process.exit(1);
}

for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] == '--help' || process.argv[i] == '-h') {
	console.log('USAGE\n\tnode base.js [--help] str\n\n\tstr\tPath to the directory to sort')
	process.exit(1);
	}

}

console.log('Are you sure you want to change your directory architecture ? (o/N)')
var readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.on('line', (answer) => {
	if (answer == 'o')
		rl.close()
	else {
		rl.close()
		process.exit(0)
	}
})
