const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizedContent(content)
    //breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content){
        
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2?timeout=300")
        const wikipediaResponse = await wikipediaAlgorithm.pipe({
            "lang" : content.lang,
            "articleName": content.searchTerm
        })
        const wikipediaContent = wikipediaResponse.get()
        
        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizedContent(content){
        const withoutBlankLinesAndMarkDown = removedBlankLinesAndMarkDown(content.sourceContentOriginal)
        const withoutDatesInParenteses = removedDatesInParenteses(withoutBlankLinesAndMarkDown)
        
        content.sourceContentSanitized = withoutDatesInParenteses

        breakContentIntoSentences(content);

        function removedBlankLinesAndMarkDown(text){
            const allLines = text.split('\n')
            
            const withoutBlankLinesAndMarkDown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                return true
            })
            return withoutBlankLinesAndMarkDown.join(' ')
        }

        function removedDatesInParenteses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
        }

        function breakContentIntoSentences(content){
            content.sentences = []

            const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
            sentences.forEach(sentence => {
                content.sentences.push({
                    text: sentence,
                    keywords: [],
                    images: []
                })
                
            });
            console.log(content)
        }
    }
}

module.exports = robot 