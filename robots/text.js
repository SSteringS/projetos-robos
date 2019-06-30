const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
  });

  const state = require('./state.js')

async function robot(content) {
    content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizedContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeywordOfAllSenteces(content)

    state.save(content)

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
    } 
    
    function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchKeywordOfAllSenteces(content){
        for (const sentence of content.sentences) {
            sentence.keywords = await fetchWatsonAndReturnKeyWords(sentence.text)
        }
    }
    
    async function fetchWatsonAndReturnKeyWords(sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features:{
                    keywords : {}
                }
            }, (error, response) => {
                if(error) {
                    throw error
                }
                
                const keywords = response.keywords.map((keyword) => {
                return keyword.text
                })

                resolve(keywords)
            })
        })
    }
}

module.exports = robot 