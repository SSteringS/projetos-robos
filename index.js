const readline = require('readline-sync')
const robots = {
	text: require('./robots/text.js')
}


async function start() {
	const content = {}

	content.searchTerm = askAndReturnSearchTerm()
	content.prefix = askAndReturnPrefix()
	content.lang = askAndReturnLanguage()

	await robots.text(content)

	function askAndReturnSearchTerm() {
		return readline.question('Type a Wikipedia search term: ')
	}

	function askAndReturnPrefix() {
		const prefixes = ['Whos is', 'What is', 'The history of']
		const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Chose one option: ')
		const selectedPrefixText = prefixes[selectedPrefixIndex]
		return selectedPrefixText
	}

	function askAndReturnLanguage(){
		const language = ['pt','en']
		const selectedLangIndex = readline.keyInSelect(language,'Choice Language: ')
		const selectedLangText = language[selectedLangIndex]
		return selectedLangText
	  }
	//console.log(content)
}

start()


