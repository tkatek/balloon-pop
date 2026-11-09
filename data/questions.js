/* Balloon Pop - Questions data.
   Contains exactly one JSON array (75 questions, 5 per level, L01-L15).
   The validator (tests/validate-data.mjs) parses the array between the
   first "[" and the last "]" of this file, so keep it as pure JSON. */
(function (root) {
  root.BP = root.BP || {};
  root.BP.questions = [
  {
    "id": "q001",
    "levelId": "L01",
    "questionType": "fill_blank",
    "prompt": "Maya ___ a teacher.",
    "options": [
      {
        "id": "a",
        "text": "am"
      },
      {
        "id": "b",
        "text": "is"
      },
      {
        "id": "c",
        "text": "are"
      },
      {
        "id": "d",
        "text": "be"
      }
    ],
    "correctOptionId": "b",
    "hint": "Maya is one person, so think about singular subjects.",
    "explanation": "We use 'is' with he, she, it and singular names like Maya.",
    "difficulty": 1
  },
  {
    "id": "q002",
    "levelId": "L01",
    "questionType": "fill_blank",
    "prompt": "They ___ from Brazil.",
    "options": [
      {
        "id": "a",
        "text": "is"
      },
      {
        "id": "b",
        "text": "am"
      },
      {
        "id": "c",
        "text": "are"
      },
      {
        "id": "d",
        "text": "be"
      }
    ],
    "correctOptionId": "c",
    "hint": "'They' is more than one person.",
    "explanation": "'Are' goes with plural subjects like they, we and you.",
    "difficulty": 1
  },
  {
    "id": "q003",
    "levelId": "L01",
    "questionType": "fill_blank",
    "prompt": "I ___ twelve years old.",
    "options": [
      {
        "id": "a",
        "text": "am"
      },
      {
        "id": "b",
        "text": "is"
      },
      {
        "id": "c",
        "text": "are"
      },
      {
        "id": "d",
        "text": "be"
      }
    ],
    "correctOptionId": "a",
    "hint": "The word 'I' has its own special verb.",
    "explanation": "With 'I', we always use 'am'.",
    "difficulty": 1
  },
  {
    "id": "q004",
    "levelId": "L01",
    "questionType": "fill_blank",
    "prompt": "The weather ___ cold today.",
    "options": [
      {
        "id": "a",
        "text": "are"
      },
      {
        "id": "b",
        "text": "am"
      },
      {
        "id": "c",
        "text": "is"
      },
      {
        "id": "d",
        "text": "being"
      }
    ],
    "correctOptionId": "c",
    "hint": "'Weather' is a singular noun.",
    "explanation": "'Weather' is singular, so it takes 'is'.",
    "difficulty": 1
  },
  {
    "id": "q005",
    "levelId": "L01",
    "questionType": "dialogue",
    "prompt": "A: Where ___ my glasses?  B: They're on the table.",
    "options": [
      {
        "id": "a",
        "text": "is"
      },
      {
        "id": "b",
        "text": "are"
      },
      {
        "id": "c",
        "text": "am"
      },
      {
        "id": "d",
        "text": "be"
      }
    ],
    "correctOptionId": "b",
    "hint": "Look carefully at B's answer: 'They're'.",
    "explanation": "'Glasses' is plural, and B answers with 'They're', so the question needs 'are'.",
    "difficulty": 2
  },
  {
    "id": "q006",
    "levelId": "L02",
    "questionType": "verb_form",
    "prompt": "She ___ to school every day.",
    "options": [
      {
        "id": "a",
        "text": "goes"
      },
      {
        "id": "b",
        "text": "go"
      },
      {
        "id": "c",
        "text": "going"
      },
      {
        "id": "d",
        "text": "gone"
      }
    ],
    "correctOptionId": "a",
    "hint": "With she, the present simple verb usually needs an extra letter.",
    "explanation": "With he, she and it, the present simple adds -s or -es: 'she goes'.",
    "difficulty": 1
  },
  {
    "id": "q007",
    "levelId": "L02",
    "questionType": "word_choice",
    "prompt": "___ they like pizza?",
    "options": [
      {
        "id": "a",
        "text": "Does"
      },
      {
        "id": "b",
        "text": "Do"
      },
      {
        "id": "c",
        "text": "Is"
      },
      {
        "id": "d",
        "text": "Are"
      }
    ],
    "correctOptionId": "b",
    "hint": "'They' is a plural subject.",
    "explanation": "Questions with they, we and you use 'Do'. 'Does' is only for he, she and it.",
    "difficulty": 1
  },
  {
    "id": "q008",
    "levelId": "L02",
    "questionType": "verb_form",
    "prompt": "My brother ___ TV in the evening.",
    "options": [
      {
        "id": "a",
        "text": "watch"
      },
      {
        "id": "b",
        "text": "watching"
      },
      {
        "id": "c",
        "text": "watches"
      },
      {
        "id": "d",
        "text": "watchs"
      }
    ],
    "correctOptionId": "c",
    "hint": "Your brother = he.",
    "explanation": "He, she and it take -es after words ending in ch: 'he watches'.",
    "difficulty": 1
  },
  {
    "id": "q009",
    "levelId": "L02",
    "questionType": "word_choice",
    "prompt": "Tom ___ like coffee.",
    "options": [
      {
        "id": "a",
        "text": "don't"
      },
      {
        "id": "b",
        "text": "doesn't"
      },
      {
        "id": "c",
        "text": "isn't"
      },
      {
        "id": "d",
        "text": "not like"
      }
    ],
    "correctOptionId": "b",
    "hint": "Tom is third person singular.",
    "explanation": "Negative present simple with he, she and it uses 'doesn't'.",
    "difficulty": 1
  },
  {
    "id": "q010",
    "levelId": "L02",
    "questionType": "dialogue",
    "prompt": "A: ___ your sister play the piano?  B: Yes, she does.",
    "options": [
      {
        "id": "a",
        "text": "Does"
      },
      {
        "id": "b",
        "text": "Do"
      },
      {
        "id": "c",
        "text": "Is"
      },
      {
        "id": "d",
        "text": "Are"
      }
    ],
    "correctOptionId": "a",
    "hint": "B's short answer tells you which question word was used.",
    "explanation": "B says 'she does', so the question must use 'Does' for a third-person singular subject.",
    "difficulty": 2
  },
  {
    "id": "q011",
    "levelId": "L03",
    "questionType": "fill_blank",
    "prompt": "The film ___ really funny yesterday.",
    "options": [
      {
        "id": "a",
        "text": "is"
      },
      {
        "id": "b",
        "text": "were"
      },
      {
        "id": "c",
        "text": "was"
      },
      {
        "id": "d",
        "text": "are"
      }
    ],
    "correctOptionId": "c",
    "hint": "'Yesterday' means past, and 'film' is singular.",
    "explanation": "A singular noun in the past takes 'was': 'the film was funny'.",
    "difficulty": 1
  },
  {
    "id": "q012",
    "levelId": "L03",
    "questionType": "fill_blank",
    "prompt": "We ___ at the beach last Sunday.",
    "options": [
      {
        "id": "a",
        "text": "were"
      },
      {
        "id": "b",
        "text": "was"
      },
      {
        "id": "c",
        "text": "are"
      },
      {
        "id": "d",
        "text": "is"
      }
    ],
    "correctOptionId": "a",
    "hint": "'We' is plural and 'last Sunday' is finished.",
    "explanation": "Plural subjects in the past take 'were': 'we were at the beach'.",
    "difficulty": 1
  },
  {
    "id": "q013",
    "levelId": "L03",
    "questionType": "fill_blank",
    "prompt": "I ___ very tired last night.",
    "options": [
      {
        "id": "a",
        "text": "were"
      },
      {
        "id": "b",
        "text": "was"
      },
      {
        "id": "c",
        "text": "am"
      },
      {
        "id": "d",
        "text": "is"
      }
    ],
    "correctOptionId": "b",
    "hint": "Use the past form that goes with 'I'.",
    "explanation": "In the past, 'I' always takes 'was'.",
    "difficulty": 1
  },
  {
    "id": "q014",
    "levelId": "L03",
    "questionType": "verb_form",
    "prompt": "Last summer we ___ to Egypt.",
    "options": [
      {
        "id": "a",
        "text": "go"
      },
      {
        "id": "b",
        "text": "went"
      },
      {
        "id": "c",
        "text": "goes"
      },
      {
        "id": "d",
        "text": "gone"
      }
    ],
    "correctOptionId": "b",
    "hint": "This verb has a special irregular past form.",
    "explanation": "'Go' is irregular: its past form is 'went'.",
    "difficulty": 1
  },
  {
    "id": "q015",
    "levelId": "L03",
    "questionType": "dialogue",
    "prompt": "A: Why ___ you late this morning?  B: Because the bus didn't come.",
    "options": [
      {
        "id": "a",
        "text": "did"
      },
      {
        "id": "b",
        "text": "are"
      },
      {
        "id": "c",
        "text": "were"
      },
      {
        "id": "d",
        "text": "was"
      }
    ],
    "correctOptionId": "c",
    "hint": "The conversation is about this morning, and 'you' needs a past plural form.",
    "explanation": "With 'you' in the past we use 'were': 'Why were you late?'",
    "difficulty": 2
  },
  {
    "id": "q016",
    "levelId": "L04",
    "questionType": "verb_form",
    "prompt": "Please be quiet - the baby ___.",
    "options": [
      {
        "id": "a",
        "text": "sleeps"
      },
      {
        "id": "b",
        "text": "is sleeping"
      },
      {
        "id": "c",
        "text": "slept"
      },
      {
        "id": "d",
        "text": "sleep"
      },
      {
        "id": "e",
        "text": "are sleeping"
      }
    ],
    "correctOptionId": "b",
    "hint": "The action is happening right now.",
    "explanation": "For actions happening at this moment, use the present continuous: 'is sleeping'.",
    "difficulty": 2
  },
  {
    "id": "q017",
    "levelId": "L04",
    "questionType": "verb_form",
    "prompt": "Rania ___ coffee every morning before school.",
    "options": [
      {
        "id": "a",
        "text": "drinks"
      },
      {
        "id": "b",
        "text": "is drinking"
      },
      {
        "id": "c",
        "text": "drank"
      },
      {
        "id": "d",
        "text": "drink"
      },
      {
        "id": "e",
        "text": "drinking"
      }
    ],
    "correctOptionId": "a",
    "hint": "'Every morning' describes a routine.",
    "explanation": "Habits and routines use the present simple: 'she drinks coffee'.",
    "difficulty": 2
  },
  {
    "id": "q018",
    "levelId": "L04",
    "questionType": "verb_form",
    "prompt": "Look! It ___ outside - take an umbrella.",
    "options": [
      {
        "id": "a",
        "text": "rains"
      },
      {
        "id": "b",
        "text": "rained"
      },
      {
        "id": "c",
        "text": "is raining"
      },
      {
        "id": "d",
        "text": "rain"
      },
      {
        "id": "e",
        "text": "raining"
      }
    ],
    "correctOptionId": "c",
    "hint": "The word 'Look!' signals something happening now.",
    "explanation": "After 'Look!', we describe the present moment: 'It is raining'.",
    "difficulty": 2
  },
  {
    "id": "q019",
    "levelId": "L04",
    "questionType": "fill_blank",
    "prompt": "My dad usually cooks dinner, but tonight he ___ pizza for us.",
    "options": [
      {
        "id": "a",
        "text": "cooks"
      },
      {
        "id": "b",
        "text": "is cooking"
      },
      {
        "id": "c",
        "text": "cooked"
      },
      {
        "id": "d",
        "text": "cook"
      },
      {
        "id": "e",
        "text": "cooking"
      }
    ],
    "correctOptionId": "b",
    "hint": "Compare 'usually' with 'tonight'.",
    "explanation": "'Usually' signals a habit (present simple), but 'tonight' is one special action happening now (present continuous).",
    "difficulty": 2
  },
  {
    "id": "q020",
    "levelId": "L04",
    "questionType": "fill_blank",
    "prompt": "Right now, the students ___ their exams, so the school is very quiet.",
    "options": [
      {
        "id": "a",
        "text": "are taking"
      },
      {
        "id": "b",
        "text": "take"
      },
      {
        "id": "c",
        "text": "took"
      },
      {
        "id": "d",
        "text": "takes"
      },
      {
        "id": "e",
        "text": "taking"
      }
    ],
    "correctOptionId": "a",
    "hint": "'Right now' tells you exactly when this happens.",
    "explanation": "'Right now' means at this moment, so we use the present continuous: 'are taking'.",
    "difficulty": 2
  },
  {
    "id": "q021",
    "levelId": "L05",
    "questionType": "word_choice",
    "prompt": "An elephant is ___ than a dog.",
    "options": [
      {
        "id": "a",
        "text": "big"
      },
      {
        "id": "b",
        "text": "biggest"
      },
      {
        "id": "c",
        "text": "bigger"
      },
      {
        "id": "d",
        "text": "more big"
      },
      {
        "id": "e",
        "text": "most big"
      }
    ],
    "correctOptionId": "c",
    "hint": "You are comparing two animals.",
    "explanation": "Comparing two things uses the comparative form with 'than': 'bigger than'.",
    "difficulty": 2
  },
  {
    "id": "q022",
    "levelId": "L05",
    "questionType": "word_choice",
    "prompt": "This is ___ cake I have ever eaten!",
    "options": [
      {
        "id": "a",
        "text": "good"
      },
      {
        "id": "b",
        "text": "the best"
      },
      {
        "id": "c",
        "text": "better"
      },
      {
        "id": "d",
        "text": "the better"
      },
      {
        "id": "e",
        "text": "most good"
      }
    ],
    "correctOptionId": "b",
    "hint": "'Ever' suggests one winner out of all cakes.",
    "explanation": "One thing out of a whole group uses the superlative: 'the best'.",
    "difficulty": 2
  },
  {
    "id": "q023",
    "levelId": "L05",
    "questionType": "word_choice",
    "prompt": "My results are ___ than last term, so I'm happy.",
    "options": [
      {
        "id": "a",
        "text": "better"
      },
      {
        "id": "b",
        "text": "best"
      },
      {
        "id": "c",
        "text": "good"
      },
      {
        "id": "d",
        "text": "more good"
      },
      {
        "id": "e",
        "text": "the best"
      }
    ],
    "correctOptionId": "a",
    "hint": "You are comparing this term with last term.",
    "explanation": "'Good' has the irregular comparative 'better', used with 'than'.",
    "difficulty": 2
  },
  {
    "id": "q024",
    "levelId": "L05",
    "questionType": "word_choice",
    "prompt": "Mount Everest is ___ mountain in the world.",
    "options": [
      {
        "id": "a",
        "text": "higher"
      },
      {
        "id": "b",
        "text": "the higher"
      },
      {
        "id": "c",
        "text": "the highest"
      },
      {
        "id": "d",
        "text": "high"
      },
      {
        "id": "e",
        "text": "most high"
      }
    ],
    "correctOptionId": "c",
    "hint": "Out of ALL mountains, there is only one winner.",
    "explanation": "The superlative compares one thing with the whole group: 'the highest mountain in the world'.",
    "difficulty": 2
  },
  {
    "id": "q025",
    "levelId": "L05",
    "questionType": "fill_blank",
    "prompt": "Leo is ___ student in the class - even the teacher asks him for help!",
    "options": [
      {
        "id": "a",
        "text": "clever"
      },
      {
        "id": "b",
        "text": "the cleverest"
      },
      {
        "id": "c",
        "text": "cleverer"
      },
      {
        "id": "d",
        "text": "cleverest"
      },
      {
        "id": "e",
        "text": "more clever"
      }
    ],
    "correctOptionId": "b",
    "hint": "Leo is compared with every student in the class.",
    "explanation": "One person above the whole class needs the superlative: 'the cleverest'.",
    "difficulty": 3
  },
  {
    "id": "q026",
    "levelId": "L06",
    "questionType": "word_choice",
    "prompt": "We have a plan: we ___ visit my grandparents this weekend.",
    "options": [
      {
        "id": "a",
        "text": "are going to"
      },
      {
        "id": "b",
        "text": "will"
      },
      {
        "id": "c",
        "text": "will going to"
      },
      {
        "id": "d",
        "text": "going to"
      },
      {
        "id": "e",
        "text": "am going to"
      }
    ],
    "correctOptionId": "a",
    "hint": "Was this decision made before speaking?",
    "explanation": "Plans and decisions made before now use 'be going to': 'we are going to visit'.",
    "difficulty": 2
  },
  {
    "id": "q027",
    "levelId": "L06",
    "questionType": "fill_blank",
    "prompt": "Look at those black clouds! It ___ rain.",
    "options": [
      {
        "id": "a",
        "text": "will"
      },
      {
        "id": "b",
        "text": "is going to"
      },
      {
        "id": "c",
        "text": "is"
      },
      {
        "id": "d",
        "text": "would"
      },
      {
        "id": "e",
        "text": "goes to"
      }
    ],
    "correctOptionId": "b",
    "hint": "You can see the evidence in the sky right now.",
    "explanation": "Predictions based on present evidence use 'be going to': 'It is going to rain'.",
    "difficulty": 2
  },
  {
    "id": "q028",
    "levelId": "L06",
    "questionType": "dialogue",
    "prompt": "That bag looks heavy. Don't worry - I ___ help you.",
    "options": [
      {
        "id": "a",
        "text": "am going to"
      },
      {
        "id": "b",
        "text": "will be"
      },
      {
        "id": "c",
        "text": "will"
      },
      {
        "id": "d",
        "text": "going to"
      },
      {
        "id": "e",
        "text": "am"
      }
    ],
    "correctOptionId": "c",
    "hint": "The speaker decides at the moment of speaking.",
    "explanation": "Instant decisions and offers use 'will': 'I'll help you' - 'I will help you'.",
    "difficulty": 2
  },
  {
    "id": "q029",
    "levelId": "L06",
    "questionType": "word_choice",
    "prompt": "Sara has decided that she ___ study medicine next year.",
    "options": [
      {
        "id": "a",
        "text": "will"
      },
      {
        "id": "b",
        "text": "is going to"
      },
      {
        "id": "c",
        "text": "going to"
      },
      {
        "id": "d",
        "text": "are going to"
      },
      {
        "id": "e",
        "text": "going"
      }
    ],
    "correctOptionId": "b",
    "hint": "The decision was already made before now.",
    "explanation": "Earlier decisions use 'be going to': 'she is going to study'. 'Going to' alone is missing the verb 'is'.",
    "difficulty": 2
  },
  {
    "id": "q030",
    "levelId": "L06",
    "questionType": "dialogue",
    "prompt": "A: The phone's ringing!  B: It's OK - I ___ answer it.",
    "options": [
      {
        "id": "a",
        "text": "am going to"
      },
      {
        "id": "b",
        "text": "go to"
      },
      {
        "id": "c",
        "text": "will"
      },
      {
        "id": "d",
        "text": "going to"
      },
      {
        "id": "e",
        "text": "will to"
      }
    ],
    "correctOptionId": "c",
    "hint": "B reacts and decides while speaking.",
    "explanation": "A spontaneous decision made while speaking uses 'will': 'I'll answer it'.",
    "difficulty": 3
  },
  {
    "id": "q031",
    "levelId": "L07",
    "questionType": "word_choice",
    "prompt": "Hurry! The film ___ started.",
    "options": [
      {
        "id": "a",
        "text": "has"
      },
      {
        "id": "b",
        "text": "is"
      },
      {
        "id": "c",
        "text": "was"
      },
      {
        "id": "d",
        "text": "did"
      },
      {
        "id": "e",
        "text": "have"
      }
    ],
    "correctOptionId": "a",
    "hint": "The film started a moment ago and it matters now.",
    "explanation": "The present perfect 'has started' connects a past action to the present moment.",
    "difficulty": 3
  },
  {
    "id": "q032",
    "levelId": "L07",
    "questionType": "verb_form",
    "prompt": "Shakespeare ___ many famous plays.",
    "options": [
      {
        "id": "a",
        "text": "has written"
      },
      {
        "id": "b",
        "text": "wrote"
      },
      {
        "id": "c",
        "text": "has wrote"
      },
      {
        "id": "d",
        "text": "writes"
      },
      {
        "id": "e",
        "text": "writing"
      }
    ],
    "correctOptionId": "b",
    "hint": "Shakespeare lived a long time ago - his life is finished.",
    "explanation": "For finished past time (a life that ended), we use the past simple: 'wrote'.",
    "difficulty": 3
  },
  {
    "id": "q033",
    "levelId": "L07",
    "questionType": "word_choice",
    "prompt": "___ you finished the exercise yet?",
    "options": [
      {
        "id": "a",
        "text": "Did"
      },
      {
        "id": "b",
        "text": "Do"
      },
      {
        "id": "c",
        "text": "Have"
      },
      {
        "id": "d",
        "text": "Are"
      },
      {
        "id": "e",
        "text": "Does"
      }
    ],
    "correctOptionId": "c",
    "hint": "'Yet' is a big clue here.",
    "explanation": "'Yet' usually goes with the present perfect: 'Have you finished yet?'",
    "difficulty": 3
  },
  {
    "id": "q034",
    "levelId": "L07",
    "questionType": "verb_form",
    "prompt": "My family ___ to Egypt in 2022 - it was amazing.",
    "options": [
      {
        "id": "a",
        "text": "has travelled"
      },
      {
        "id": "b",
        "text": "travelled"
      },
      {
        "id": "c",
        "text": "travelling"
      },
      {
        "id": "d",
        "text": "travels"
      },
      {
        "id": "e",
        "text": "has travel"
      }
    ],
    "correctOptionId": "b",
    "hint": "'In 2022' is a finished time.",
    "explanation": "A finished past time expression like 'in 2022' takes the past simple: 'travelled'.",
    "difficulty": 3
  },
  {
    "id": "q035",
    "levelId": "L07",
    "questionType": "fill_blank",
    "prompt": "Grandpa ___ in this house since 1970.",
    "options": [
      {
        "id": "a",
        "text": "lives"
      },
      {
        "id": "b",
        "text": "lived"
      },
      {
        "id": "c",
        "text": "is living"
      },
      {
        "id": "d",
        "text": "has lived"
      },
      {
        "id": "e",
        "text": "does live"
      }
    ],
    "correctOptionId": "d",
    "hint": "He started in 1970 and he is still there now.",
    "explanation": "'Since 1970' with a situation continuing now uses the present perfect: 'has lived'.",
    "difficulty": 3
  },
  {
    "id": "q036",
    "levelId": "L08",
    "questionType": "word_choice",
    "prompt": "___ you swim when you were five years old?",
    "options": [
      {
        "id": "a",
        "text": "Can"
      },
      {
        "id": "b",
        "text": "Could"
      },
      {
        "id": "c",
        "text": "Should"
      },
      {
        "id": "d",
        "text": "Must"
      },
      {
        "id": "e",
        "text": "May"
      }
    ],
    "correctOptionId": "b",
    "hint": "This is about ability in the past.",
    "explanation": "'Could' expresses past ability: 'I could swim when I was five'.",
    "difficulty": 3
  },
  {
    "id": "q037",
    "levelId": "L08",
    "questionType": "word_choice",
    "prompt": "It's a holiday tomorrow, so we ___ get up early.",
    "options": [
      {
        "id": "a",
        "text": "mustn't"
      },
      {
        "id": "b",
        "text": "shouldn't"
      },
      {
        "id": "c",
        "text": "can't"
      },
      {
        "id": "d",
        "text": "don't have to"
      },
      {
        "id": "e",
        "text": "not have to"
      }
    ],
    "correctOptionId": "d",
    "hint": "It is not necessary - but it is not forbidden either.",
    "explanation": "'Don't have to' means something is not necessary. 'Mustn't' means it is forbidden.",
    "difficulty": 3
  },
  {
    "id": "q038",
    "levelId": "L08",
    "questionType": "word_choice",
    "prompt": "If you want to pass the test, you ___ study harder.",
    "options": [
      {
        "id": "a",
        "text": "should"
      },
      {
        "id": "b",
        "text": "can't"
      },
      {
        "id": "c",
        "text": "mustn't"
      },
      {
        "id": "d",
        "text": "shouldn't"
      },
      {
        "id": "e",
        "text": "should to"
      }
    ],
    "correctOptionId": "a",
    "hint": "This is friendly advice.",
    "explanation": "'Should' gives advice or a recommendation: 'you should study harder'.",
    "difficulty": 3
  },
  {
    "id": "q039",
    "levelId": "L08",
    "questionType": "fill_blank",
    "prompt": "Careful! The floor is wet - you ___ slip.",
    "options": [
      {
        "id": "a",
        "text": "must"
      },
      {
        "id": "b",
        "text": "should"
      },
      {
        "id": "c",
        "text": "might"
      },
      {
        "id": "d",
        "text": "have to"
      },
      {
        "id": "e",
        "text": "must to"
      }
    ],
    "correctOptionId": "c",
    "hint": "It is possible, but not certain.",
    "explanation": "'Might' expresses possibility: 'you might slip'.",
    "difficulty": 3
  },
  {
    "id": "q040",
    "levelId": "L08",
    "questionType": "dialogue",
    "prompt": "A: Can I borrow your pen?  B: Of course you ___ - here it is.",
    "options": [
      {
        "id": "a",
        "text": "must"
      },
      {
        "id": "b",
        "text": "can"
      },
      {
        "id": "c",
        "text": "should"
      },
      {
        "id": "d",
        "text": "might"
      },
      {
        "id": "e",
        "text": "can to"
      }
    ],
    "correctOptionId": "b",
    "hint": "B is giving permission.",
    "explanation": "'Can' expresses permission: 'you can borrow it'.",
    "difficulty": 3
  },
  {
    "id": "q041",
    "levelId": "L09",
    "questionType": "verb_form",
    "prompt": "If you ___ water to 100 degrees, it boils.",
    "options": [
      {
        "id": "a",
        "text": "will heat"
      },
      {
        "id": "b",
        "text": "heats"
      },
      {
        "id": "c",
        "text": "heat"
      },
      {
        "id": "d",
        "text": "heated"
      },
      {
        "id": "e",
        "text": "will heated"
      }
    ],
    "correctOptionId": "c",
    "hint": "This is a general fact that is always true.",
    "explanation": "The zero conditional uses the present simple in both parts: 'If you heat water, it boils'.",
    "difficulty": 3
  },
  {
    "id": "q042",
    "levelId": "L09",
    "questionType": "verb_form",
    "prompt": "If it rains tomorrow, we ___ the picnic.",
    "options": [
      {
        "id": "a",
        "text": "will cancel"
      },
      {
        "id": "b",
        "text": "cancel"
      },
      {
        "id": "c",
        "text": "cancelled"
      },
      {
        "id": "d",
        "text": "would cancel"
      },
      {
        "id": "e",
        "text": "will cancelled"
      }
    ],
    "correctOptionId": "a",
    "hint": "This is a real possibility about tomorrow.",
    "explanation": "The first conditional uses 'will' in the result: 'If it rains, we will cancel'.",
    "difficulty": 3
  },
  {
    "id": "q043",
    "levelId": "L09",
    "questionType": "verb_form",
    "prompt": "Plants ___ if they don't get enough water.",
    "options": [
      {
        "id": "a",
        "text": "would die"
      },
      {
        "id": "b",
        "text": "died"
      },
      {
        "id": "c",
        "text": "are dying"
      },
      {
        "id": "d",
        "text": "die"
      },
      {
        "id": "e",
        "text": "dies"
      }
    ],
    "correctOptionId": "d",
    "hint": "This happens every time - it is a general truth.",
    "explanation": "The zero conditional describes facts with the present simple: 'Plants die if they don't get water'.",
    "difficulty": 3
  },
  {
    "id": "q044",
    "levelId": "L09",
    "questionType": "verb_form",
    "prompt": "If you don't hurry, you ___ the bus.",
    "options": [
      {
        "id": "a",
        "text": "miss"
      },
      {
        "id": "b",
        "text": "will miss"
      },
      {
        "id": "c",
        "text": "would miss"
      },
      {
        "id": "d",
        "text": "are missing"
      },
      {
        "id": "e",
        "text": "missed"
      }
    ],
    "correctOptionId": "b",
    "hint": "This is a real warning about the near future.",
    "explanation": "A real future possibility uses the first conditional: 'If you don't hurry, you will miss the bus'.",
    "difficulty": 3
  },
  {
    "id": "q045",
    "levelId": "L09",
    "questionType": "fill_blank",
    "prompt": "I'll call you as soon as I ___ at the hotel.",
    "options": [
      {
        "id": "a",
        "text": "will arrive"
      },
      {
        "id": "b",
        "text": "am arriving"
      },
      {
        "id": "c",
        "text": "arrived"
      },
      {
        "id": "d",
        "text": "arrive"
      },
      {
        "id": "e",
        "text": "arrives"
      }
    ],
    "correctOptionId": "d",
    "hint": "After 'as soon as', we do not use 'will'.",
    "explanation": "In time clauses after 'as soon as', 'when' and 'until', we use the present simple: 'as soon as I arrive'.",
    "difficulty": 4
  },
  {
    "id": "q046",
    "levelId": "L10",
    "questionType": "verb_form",
    "prompt": "The letters ___ yesterday morning.",
    "options": [
      {
        "id": "a",
        "text": "are delivered"
      },
      {
        "id": "b",
        "text": "were delivered"
      },
      {
        "id": "c",
        "text": "delivered"
      },
      {
        "id": "d",
        "text": "deliver"
      },
      {
        "id": "e",
        "text": "was delivered"
      }
    ],
    "correctOptionId": "b",
    "hint": "The action happened in the past, and the letters receive the action.",
    "explanation": "Past passive = was/were + past participle: 'The letters were delivered'.",
    "difficulty": 3
  },
  {
    "id": "q047",
    "levelId": "L10",
    "questionType": "verb_form",
    "prompt": "English ___ in more than fifty countries.",
    "options": [
      {
        "id": "a",
        "text": "is spoken"
      },
      {
        "id": "b",
        "text": "speaks"
      },
      {
        "id": "c",
        "text": "is speaking"
      },
      {
        "id": "d",
        "text": "spoke"
      },
      {
        "id": "e",
        "text": "is speak"
      }
    ],
    "correctOptionId": "a",
    "hint": "People speak TO English - it does not do the action.",
    "explanation": "When the subject receives the action, use the passive: 'English is spoken'.",
    "difficulty": 3
  },
  {
    "id": "q048",
    "levelId": "L10",
    "questionType": "verb_form",
    "prompt": "The Mona Lisa ___ by Leonardo da Vinci.",
    "options": [
      {
        "id": "a",
        "text": "painted"
      },
      {
        "id": "b",
        "text": "is painting"
      },
      {
        "id": "c",
        "text": "paints"
      },
      {
        "id": "d",
        "text": "was painted"
      },
      {
        "id": "e",
        "text": "has painted"
      }
    ],
    "correctOptionId": "d",
    "hint": "The painting happened long ago, and 'by' names the painter.",
    "explanation": "Past passive with an agent: 'The Mona Lisa was painted by Leonardo da Vinci'.",
    "difficulty": 3
  },
  {
    "id": "q049",
    "levelId": "L10",
    "questionType": "verb_form",
    "prompt": "Paper ___ from trees.",
    "options": [
      {
        "id": "a",
        "text": "makes"
      },
      {
        "id": "b",
        "text": "made"
      },
      {
        "id": "c",
        "text": "is made"
      },
      {
        "id": "d",
        "text": "making"
      },
      {
        "id": "e",
        "text": "is making"
      }
    ],
    "correctOptionId": "c",
    "hint": "Paper does not make itself - it receives the action.",
    "explanation": "General facts in the passive use 'is/are + past participle': 'Paper is made from trees'.",
    "difficulty": 3
  },
  {
    "id": "q050",
    "levelId": "L10",
    "questionType": "word_choice",
    "prompt": "___ these photos taken with your new camera?",
    "options": [
      {
        "id": "a",
        "text": "Were"
      },
      {
        "id": "b",
        "text": "Was"
      },
      {
        "id": "c",
        "text": "Are"
      },
      {
        "id": "d",
        "text": "Did"
      },
      {
        "id": "e",
        "text": "Has"
      }
    ],
    "correctOptionId": "a",
    "hint": "'Photos' is plural and the taking happened in the past.",
    "explanation": "A past passive question with a plural subject uses 'Were': 'Were these photos taken...?'",
    "difficulty": 4
  },
  {
    "id": "q051",
    "levelId": "L11",
    "questionType": "word_choice",
    "prompt": "That's the boy ___ won the art competition.",
    "options": [
      {
        "id": "a",
        "text": "which"
      },
      {
        "id": "b",
        "text": "whose"
      },
      {
        "id": "c",
        "text": "who"
      },
      {
        "id": "d",
        "text": "whom"
      },
      {
        "id": "e",
        "text": "who's"
      }
    ],
    "correctOptionId": "c",
    "hint": "A person is doing the action of winning.",
    "explanation": "'Who' refers to people and works as the subject of the verb 'won'.",
    "difficulty": 3
  },
  {
    "id": "q052",
    "levelId": "L11",
    "questionType": "word_choice",
    "prompt": "This is the restaurant ___ we had dinner last week.",
    "options": [
      {
        "id": "a",
        "text": "when"
      },
      {
        "id": "b",
        "text": "which"
      },
      {
        "id": "c",
        "text": "that"
      },
      {
        "id": "d",
        "text": "where"
      },
      {
        "id": "e",
        "text": "what"
      }
    ],
    "correctOptionId": "d",
    "hint": "The missing word describes a place.",
    "explanation": "'Where' introduces a relative clause about a place: 'the restaurant where we had dinner'.",
    "difficulty": 3
  },
  {
    "id": "q053",
    "levelId": "L11",
    "questionType": "word_choice",
    "prompt": "I love the painting ___ hangs in the hallway.",
    "options": [
      {
        "id": "a",
        "text": "which"
      },
      {
        "id": "b",
        "text": "who"
      },
      {
        "id": "c",
        "text": "where"
      },
      {
        "id": "d",
        "text": "whose"
      },
      {
        "id": "e",
        "text": "whom"
      }
    ],
    "correctOptionId": "a",
    "hint": "A painting is a thing, and it hangs somewhere.",
    "explanation": "'Which' (or 'that') refers to things and acts as the subject of 'hangs'.",
    "difficulty": 3
  },
  {
    "id": "q054",
    "levelId": "L11",
    "questionType": "word_choice",
    "prompt": "That's the woman ___ son is a famous actor.",
    "options": [
      {
        "id": "a",
        "text": "who"
      },
      {
        "id": "b",
        "text": "whose"
      },
      {
        "id": "c",
        "text": "which"
      },
      {
        "id": "d",
        "text": "who's"
      },
      {
        "id": "e",
        "text": "whom"
      }
    ],
    "correctOptionId": "b",
    "hint": "The woman possesses the son.",
    "explanation": "'Whose' shows possession: 'the woman whose son...'. 'Who's' means 'who is'.",
    "difficulty": 4
  },
  {
    "id": "q055",
    "levelId": "L11",
    "questionType": "word_choice",
    "prompt": "Rabat, ___ is the capital of Morocco, is a beautiful city.",
    "options": [
      {
        "id": "a",
        "text": "that"
      },
      {
        "id": "b",
        "text": "who"
      },
      {
        "id": "c",
        "text": "where"
      },
      {
        "id": "d",
        "text": "which"
      },
      {
        "id": "e",
        "text": "whose"
      }
    ],
    "correctOptionId": "d",
    "hint": "The commas around the extra information are important.",
    "explanation": "After a comma (a non-defining clause) we use 'which', never 'that', for things.",
    "difficulty": 4
  },
  {
    "id": "q056",
    "levelId": "L12",
    "questionType": "word_choice",
    "prompt": "When we got to the station, the train ___ already left.",
    "options": [
      {
        "id": "a",
        "text": "has"
      },
      {
        "id": "b",
        "text": "had"
      },
      {
        "id": "c",
        "text": "was"
      },
      {
        "id": "d",
        "text": "did"
      },
      {
        "id": "e",
        "text": "have"
      }
    ],
    "correctOptionId": "a",
    "hint": "Which happened first: your arrival or the train's departure?",
    "explanation": "The earlier of two past events uses the past perfect: 'the train had already left'.",
    "difficulty": 4
  },
  {
    "id": "q057",
    "levelId": "L12",
    "questionType": "verb_form",
    "prompt": "By the time the police arrived, the thief ___.",
    "options": [
      {
        "id": "a",
        "text": "has escaped"
      },
      {
        "id": "b",
        "text": "escapes"
      },
      {
        "id": "c",
        "text": "had escaped"
      },
      {
        "id": "d",
        "text": "escaping"
      },
      {
        "id": "e",
        "text": "was escaped"
      }
    ],
    "correctOptionId": "c",
    "hint": "The escape happened before the police arrived.",
    "explanation": "'By the time' + past simple needs the past perfect for the earlier action: 'had escaped'.",
    "difficulty": 4
  },
  {
    "id": "q058",
    "levelId": "L12",
    "questionType": "verb_form",
    "prompt": "By 8 o'clock, the children ___ their homework and were watching TV.",
    "options": [
      {
        "id": "a",
        "text": "finish"
      },
      {
        "id": "b",
        "text": "have finished"
      },
      {
        "id": "c",
        "text": "finished"
      },
      {
        "id": "d",
        "text": "had finished"
      },
      {
        "id": "e",
        "text": "had finish"
      }
    ],
    "correctOptionId": "d",
    "hint": "The homework was completed before 8 o'clock.",
    "explanation": "An action completed before a point in the past uses the past perfect: 'had finished'.",
    "difficulty": 4
  },
  {
    "id": "q059",
    "levelId": "L12",
    "questionType": "dialogue",
    "prompt": "A: Why was Ali so hungry at lunch?  B: Because he ___ breakfast.",
    "options": [
      {
        "id": "a",
        "text": "hasn't had"
      },
      {
        "id": "b",
        "text": "hadn't had"
      },
      {
        "id": "c",
        "text": "didn't had"
      },
      {
        "id": "d",
        "text": "wouldn't have"
      },
      {
        "id": "e",
        "text": "haven't had"
      }
    ],
    "correctOptionId": "b",
    "hint": "The missing breakfast happened earlier that morning.",
    "explanation": "The earlier past event uses the past perfect of 'have': 'he hadn't had breakfast'.",
    "difficulty": 4
  },
  {
    "id": "q060",
    "levelId": "L12",
    "questionType": "fill_blank",
    "prompt": "The plane ___ when we arrived - we were too late!",
    "options": [
      {
        "id": "a",
        "text": "has left"
      },
      {
        "id": "b",
        "text": "leaves"
      },
      {
        "id": "c",
        "text": "had left"
      },
      {
        "id": "d",
        "text": "is leaving"
      },
      {
        "id": "e",
        "text": "was left"
      }
    ],
    "correctOptionId": "c",
    "hint": "The plane departed before your arrival.",
    "explanation": "The departure happened before another past moment, so we use 'had left'.",
    "difficulty": 4
  },
  {
    "id": "q061",
    "levelId": "L13",
    "questionType": "verb_form",
    "prompt": "If I ___ rich, I would travel around the world.",
    "options": [
      {
        "id": "a",
        "text": "am"
      },
      {
        "id": "b",
        "text": "were"
      },
      {
        "id": "c",
        "text": "be"
      },
      {
        "id": "d",
        "text": "is"
      },
      {
        "id": "e",
        "text": "being"
      }
    ],
    "correctOptionId": "b",
    "hint": "This is an imaginary situation, not real.",
    "explanation": "The second conditional uses 'were' for all subjects: 'If I were rich, I would travel'.",
    "difficulty": 4
  },
  {
    "id": "q062",
    "levelId": "L13",
    "questionType": "verb_form",
    "prompt": "If she had studied harder, she ___ the exam.",
    "options": [
      {
        "id": "a",
        "text": "would pass"
      },
      {
        "id": "b",
        "text": "passed"
      },
      {
        "id": "c",
        "text": "will pass"
      },
      {
        "id": "d",
        "text": "would have passed"
      },
      {
        "id": "e",
        "text": "passes"
      }
    ],
    "correctOptionId": "d",
    "hint": "She did not study, and she did not pass - imagine the opposite.",
    "explanation": "The third conditional: 'If + had + participle, would have + participle'.",
    "difficulty": 5
  },
  {
    "id": "q063",
    "levelId": "L13",
    "questionType": "verb_form",
    "prompt": "If we ___ a car, we could drive to the beach.",
    "options": [
      {
        "id": "a",
        "text": "had"
      },
      {
        "id": "b",
        "text": "have"
      },
      {
        "id": "c",
        "text": "will have"
      },
      {
        "id": "d",
        "text": "had had"
      },
      {
        "id": "e",
        "text": "would have"
      }
    ],
    "correctOptionId": "a",
    "hint": "We do not have a car now - it is an unreal present.",
    "explanation": "The second conditional uses the past simple in the if-clause: 'If we had a car'.",
    "difficulty": 4
  },
  {
    "id": "q064",
    "levelId": "L13",
    "questionType": "verb_form",
    "prompt": "He would have called you if he ___ your number.",
    "options": [
      {
        "id": "a",
        "text": "knows"
      },
      {
        "id": "b",
        "text": "knew"
      },
      {
        "id": "c",
        "text": "would have known"
      },
      {
        "id": "d",
        "text": "has known"
      },
      {
        "id": "e",
        "text": "had known"
      }
    ],
    "correctOptionId": "e",
    "hint": "In the past, he did not know your number.",
    "explanation": "The if-part of a third conditional uses the past perfect: 'if he had known'.",
    "difficulty": 5
  },
  {
    "id": "q065",
    "levelId": "L13",
    "questionType": "fill_blank",
    "prompt": "If I hadn't missed the bus, I ___ late for work now.",
    "options": [
      {
        "id": "a",
        "text": "wouldn't have been"
      },
      {
        "id": "b",
        "text": "wasn't"
      },
      {
        "id": "c",
        "text": "wouldn't be"
      },
      {
        "id": "d",
        "text": "won't be"
      },
      {
        "id": "e",
        "text": "am not"
      }
    ],
    "correctOptionId": "c",
    "hint": "The word 'now' tells you the result is in the present.",
    "explanation": "Past condition ('hadn't missed') with a present result ('now') uses 'wouldn't be' - a mixed conditional.",
    "difficulty": 5
  },
  {
    "id": "q066",
    "levelId": "L14",
    "questionType": "correction",
    "prompt": "Direct: \"I am tired,\" she said.  Reported: She said that she ___ tired.",
    "options": [
      {
        "id": "a",
        "text": "is"
      },
      {
        "id": "b",
        "text": "were"
      },
      {
        "id": "c",
        "text": "has been"
      },
      {
        "id": "d",
        "text": "was"
      },
      {
        "id": "e",
        "text": "will be"
      }
    ],
    "correctOptionId": "d",
    "hint": "Move the tense one step back into the past.",
    "explanation": "In reported speech, 'am' becomes 'was': she said that she was tired.",
    "difficulty": 4
  },
  {
    "id": "q067",
    "levelId": "L14",
    "questionType": "correction",
    "prompt": "Direct: \"I will call you tomorrow,\" he said.  Reported: He said he ___ me the next day.",
    "options": [
      {
        "id": "a",
        "text": "would call"
      },
      {
        "id": "b",
        "text": "will call"
      },
      {
        "id": "c",
        "text": "called"
      },
      {
        "id": "d",
        "text": "calls"
      },
      {
        "id": "e",
        "text": "is calling"
      }
    ],
    "correctOptionId": "a",
    "hint": "'Will' changes when we report it.",
    "explanation": "In reported speech, 'will' becomes 'would', and 'tomorrow' becomes 'the next day'.",
    "difficulty": 4
  },
  {
    "id": "q068",
    "levelId": "L14",
    "questionType": "correction",
    "prompt": "Direct: \"Where do you live?\" she asked.  Reported: She asked me where I ___.",
    "options": [
      {
        "id": "a",
        "text": "do you live"
      },
      {
        "id": "b",
        "text": "did you live"
      },
      {
        "id": "c",
        "text": "live you"
      },
      {
        "id": "d",
        "text": "did live"
      },
      {
        "id": "e",
        "text": "lived"
      }
    ],
    "correctOptionId": "e",
    "hint": "Reported questions use normal sentence order, not question order.",
    "explanation": "A reported question drops the auxiliary 'do' and uses statement order: 'where I lived'.",
    "difficulty": 5
  },
  {
    "id": "q069",
    "levelId": "L14",
    "questionType": "word_choice",
    "prompt": "The lights are off and the car is gone. They ___ be at home.",
    "options": [
      {
        "id": "a",
        "text": "must"
      },
      {
        "id": "b",
        "text": "can't"
      },
      {
        "id": "c",
        "text": "should"
      },
      {
        "id": "d",
        "text": "may"
      },
      {
        "id": "e",
        "text": "will"
      }
    ],
    "correctOptionId": "b",
    "hint": "The evidence makes it impossible, not just unlikely.",
    "explanation": "'Can't' is a deduction from evidence: 'They can't be at home'. 'Must' would mean you are sure they ARE.",
    "difficulty": 4
  },
  {
    "id": "q070",
    "levelId": "L14",
    "questionType": "correction",
    "prompt": "Direct: \"Don't touch the paint!\"  Reported: The teacher told us ___ the paint.",
    "options": [
      {
        "id": "a",
        "text": "don't touch"
      },
      {
        "id": "b",
        "text": "not touching"
      },
      {
        "id": "c",
        "text": "not to touch"
      },
      {
        "id": "d",
        "text": "no touching"
      },
      {
        "id": "e",
        "text": "didn't touch"
      }
    ],
    "correctOptionId": "c",
    "hint": "After 'told us', a full infinitive is hiding in the answer.",
    "explanation": "Reported negative commands use 'told + person + not to + verb': 'told us not to touch'.",
    "difficulty": 5
  },
  {
    "id": "q071",
    "levelId": "L15",
    "questionType": "verb_form",
    "prompt": "I really wish I ___ how to fly a plane.",
    "options": [
      {
        "id": "a",
        "text": "know"
      },
      {
        "id": "b",
        "text": "will know"
      },
      {
        "id": "c",
        "text": "knew"
      },
      {
        "id": "d",
        "text": "have known"
      },
      {
        "id": "e",
        "text": "am knowing"
      }
    ],
    "correctOptionId": "c",
    "hint": "A wish about now uses an unreal tense.",
    "explanation": "'Wish' about an unreal present uses the past simple: 'I wish I knew'.",
    "difficulty": 5
  },
  {
    "id": "q072",
    "levelId": "L15",
    "questionType": "verb_form",
    "prompt": "It's midnight! It's high time we ___ home.",
    "options": [
      {
        "id": "a",
        "text": "go"
      },
      {
        "id": "b",
        "text": "will go"
      },
      {
        "id": "c",
        "text": "are going"
      },
      {
        "id": "d",
        "text": "have gone"
      },
      {
        "id": "e",
        "text": "went"
      }
    ],
    "correctOptionId": "e",
    "hint": "'It's high time' is followed by a surprising tense.",
    "explanation": "After 'it's time / it's high time', we use the past simple: 'it's high time we went home'.",
    "difficulty": 5
  },
  {
    "id": "q073",
    "levelId": "L15",
    "questionType": "word_choice",
    "prompt": "When I was a child, I ___ afraid of the dark, but now I'm not.",
    "options": [
      {
        "id": "a",
        "text": "used to be"
      },
      {
        "id": "b",
        "text": "use to be"
      },
      {
        "id": "c",
        "text": "was used to be"
      },
      {
        "id": "d",
        "text": "am used to be"
      },
      {
        "id": "e",
        "text": "used to being"
      }
    ],
    "correctOptionId": "a",
    "hint": "This describes a past habit or state that is now finished.",
    "explanation": "'Used to + base verb' describes a past state that has stopped: 'I used to be afraid'.",
    "difficulty": 5
  },
  {
    "id": "q074",
    "levelId": "L15",
    "questionType": "word_choice",
    "prompt": "If it ___ for your help, I would have failed the exam.",
    "options": [
      {
        "id": "a",
        "text": "isn't"
      },
      {
        "id": "b",
        "text": "wasn't"
      },
      {
        "id": "c",
        "text": "wouldn't be"
      },
      {
        "id": "d",
        "text": "hadn't been"
      },
      {
        "id": "e",
        "text": "hasn't been"
      }
    ],
    "correctOptionId": "d",
    "hint": "The result clause is a third conditional.",
    "explanation": "The fixed phrase is 'If it hadn't been for...' - the third conditional form.",
    "difficulty": 5
  },
  {
    "id": "q075",
    "levelId": "L15",
    "questionType": "fill_blank",
    "prompt": "Not only ___ the exam, but she also got the highest mark in the class.",
    "options": [
      {
        "id": "a",
        "text": "she passed"
      },
      {
        "id": "b",
        "text": "did she pass"
      },
      {
        "id": "c",
        "text": "she did pass"
      },
      {
        "id": "d",
        "text": "passed she"
      },
      {
        "id": "e",
        "text": "does she pass"
      }
    ],
    "correctOptionId": "b",
    "hint": "When a sentence starts with 'Not only', the subject and verb swap places.",
    "explanation": "After 'Not only' at the start of a sentence, we invert: 'Not only did she pass, but she also...'",
    "difficulty": 5
  }
];
})(typeof window !== 'undefined' ? window : globalThis);
