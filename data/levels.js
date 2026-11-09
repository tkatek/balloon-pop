/* Balloon Pop - Level definitions.
   Contains exactly one JSON array (15 levels, L01-L15).
   The game reads these settings dynamically - nothing about a level
   is hard-coded in game.js. The validator parses the array between
   the first "[" and the last "]" of this file, so keep it as pure JSON. */
(function (root) {
  root.BP = root.BP || {};
  root.BP.levels = [
  {
    "id": "L01",
    "name": "First Pops",
    "cefr": "A1",
    "grammarTopic": "Am, is, are",
    "questionIds": [
      "q001",
      "q002",
      "q003",
      "q004",
      "q005"
    ],
    "timeLimitSeconds": null,
    "choiceCount": 4,
    "movementPattern": "float",
    "movementSpeed": 14,
    "bossQuestionId": "q005",
    "bossBonusSeconds": 5,
    "difficulty": 1,
    "reward": {
      "first": {
        "freeze": 1
      },
      "perfect": {
        "fifty": 1
      }
    }
  },
  {
    "id": "L02",
    "name": "Daily Routine",
    "cefr": "A1",
    "grammarTopic": "Present simple: do / does",
    "questionIds": [
      "q006",
      "q007",
      "q008",
      "q009",
      "q010"
    ],
    "timeLimitSeconds": null,
    "choiceCount": 4,
    "movementPattern": "float",
    "movementSpeed": 16,
    "bossQuestionId": "q010",
    "bossBonusSeconds": 5,
    "difficulty": 1,
    "reward": {
      "first": {
        "fifty": 1
      },
      "perfect": {
        "shield": 1
      }
    }
  },
  {
    "id": "L03",
    "name": "Yesterday's Adventure",
    "cefr": "A1",
    "grammarTopic": "Was, were, simple past",
    "questionIds": [
      "q011",
      "q012",
      "q013",
      "q014",
      "q015"
    ],
    "timeLimitSeconds": null,
    "choiceCount": 4,
    "movementPattern": "float",
    "movementSpeed": 18,
    "bossQuestionId": "q015",
    "bossBonusSeconds": 5,
    "difficulty": 1,
    "reward": {
      "first": {
        "shield": 1
      },
      "perfect": {
        "freeze": 1
      }
    }
  },
  {
    "id": "L04",
    "name": "Action Time",
    "cefr": "A2",
    "grammarTopic": "Present continuous vs. present simple",
    "questionIds": [
      "q016",
      "q017",
      "q018",
      "q019",
      "q020"
    ],
    "timeLimitSeconds": 40,
    "choiceCount": 5,
    "movementPattern": "drift",
    "movementSpeed": 26,
    "bossQuestionId": "q020",
    "bossBonusSeconds": 5,
    "difficulty": 2,
    "reward": {
      "first": {
        "freeze": 1
      },
      "perfect": {
        "fifty": 1
      }
    }
  },
  {
    "id": "L05",
    "name": "Comparison Clouds",
    "cefr": "A2",
    "grammarTopic": "Comparatives and superlatives",
    "questionIds": [
      "q021",
      "q022",
      "q023",
      "q024",
      "q025"
    ],
    "timeLimitSeconds": 38,
    "choiceCount": 5,
    "movementPattern": "drift",
    "movementSpeed": 28,
    "bossQuestionId": "q025",
    "bossBonusSeconds": 5,
    "difficulty": 2,
    "reward": {
      "first": {
        "fifty": 1
      },
      "perfect": {
        "shield": 1
      }
    }
  },
  {
    "id": "L06",
    "name": "Future Flight",
    "cefr": "A2",
    "grammarTopic": "Will vs. going to",
    "questionIds": [
      "q026",
      "q027",
      "q028",
      "q029",
      "q030"
    ],
    "timeLimitSeconds": 38,
    "choiceCount": 5,
    "movementPattern": "drift",
    "movementSpeed": 30,
    "bossQuestionId": "q030",
    "bossBonusSeconds": 5,
    "difficulty": 2,
    "reward": {
      "first": {
        "shield": 1
      },
      "perfect": {
        "freeze": 1
      }
    }
  },
  {
    "id": "L07",
    "name": "Life Experiences",
    "cefr": "B1",
    "grammarTopic": "Present perfect vs. past simple",
    "questionIds": [
      "q031",
      "q032",
      "q033",
      "q034",
      "q035"
    ],
    "timeLimitSeconds": 36,
    "choiceCount": 5,
    "movementPattern": "wave",
    "movementSpeed": 36,
    "bossQuestionId": "q035",
    "bossBonusSeconds": 5,
    "difficulty": 3,
    "reward": {
      "first": {
        "fifty": 1
      },
      "perfect": {
        "shield": 1
      }
    }
  },
  {
    "id": "L08",
    "name": "Choose Wisely",
    "cefr": "B1",
    "grammarTopic": "Modals: advice, obligation, possibility",
    "questionIds": [
      "q036",
      "q037",
      "q038",
      "q039",
      "q040"
    ],
    "timeLimitSeconds": 36,
    "choiceCount": 5,
    "movementPattern": "wave",
    "movementSpeed": 38,
    "bossQuestionId": "q040",
    "bossBonusSeconds": 5,
    "difficulty": 3,
    "reward": {
      "first": {
        "freeze": 1
      },
      "perfect": {
        "fifty": 1
      }
    }
  },
  {
    "id": "L09",
    "name": "If It Happens",
    "cefr": "B1",
    "grammarTopic": "Zero and first conditionals",
    "questionIds": [
      "q041",
      "q042",
      "q043",
      "q044",
      "q045"
    ],
    "timeLimitSeconds": 35,
    "choiceCount": 5,
    "movementPattern": "wave",
    "movementSpeed": 40,
    "bossQuestionId": "q045",
    "bossBonusSeconds": 5,
    "difficulty": 3,
    "reward": {
      "first": {
        "shield": 1
      },
      "perfect": {
        "freeze": 1
      }
    }
  },
  {
    "id": "L10",
    "name": "Passive Sky",
    "cefr": "B1",
    "grammarTopic": "Passive voice",
    "questionIds": [
      "q046",
      "q047",
      "q048",
      "q049",
      "q050"
    ],
    "timeLimitSeconds": 35,
    "choiceCount": 5,
    "movementPattern": "stagger",
    "movementSpeed": 42,
    "bossQuestionId": "q050",
    "bossBonusSeconds": 5,
    "difficulty": 3,
    "reward": {
      "first": {
        "fifty": 1
      },
      "perfect": {
        "shield": 1
      }
    }
  },
  {
    "id": "L11",
    "name": "Connecting Words",
    "cefr": "B1+",
    "grammarTopic": "Relative clauses",
    "questionIds": [
      "q051",
      "q052",
      "q053",
      "q054",
      "q055"
    ],
    "timeLimitSeconds": 34,
    "choiceCount": 5,
    "movementPattern": "stagger",
    "movementSpeed": 44,
    "bossQuestionId": "q055",
    "bossBonusSeconds": 5,
    "difficulty": 3,
    "reward": {
      "first": {
        "freeze": 1
      },
      "perfect": {
        "fifty": 1
      }
    }
  },
  {
    "id": "L12",
    "name": "Before It Happened",
    "cefr": "B2",
    "grammarTopic": "Past perfect",
    "questionIds": [
      "q056",
      "q057",
      "q058",
      "q059",
      "q060"
    ],
    "timeLimitSeconds": 34,
    "choiceCount": 5,
    "movementPattern": "stagger",
    "movementSpeed": 46,
    "bossQuestionId": "q060",
    "bossBonusSeconds": 5,
    "difficulty": 4,
    "reward": {
      "first": {
        "shield": 1
      },
      "perfect": {
        "freeze": 1
      }
    }
  },
  {
    "id": "L13",
    "name": "Imaginary Worlds",
    "cefr": "B2",
    "grammarTopic": "Second and third conditionals",
    "questionIds": [
      "q061",
      "q062",
      "q063",
      "q064",
      "q065"
    ],
    "timeLimitSeconds": 34,
    "choiceCount": 5,
    "movementPattern": "combo",
    "movementSpeed": 50,
    "bossQuestionId": "q065",
    "bossBonusSeconds": 5,
    "difficulty": 4,
    "reward": {
      "first": {
        "fifty": 1
      },
      "perfect": {
        "shield": 1
      }
    }
  },
  {
    "id": "L14",
    "name": "Words and Meaning",
    "cefr": "B2",
    "grammarTopic": "Reported speech and deduction",
    "questionIds": [
      "q066",
      "q067",
      "q068",
      "q069",
      "q070"
    ],
    "timeLimitSeconds": 32,
    "choiceCount": 5,
    "movementPattern": "combo",
    "movementSpeed": 52,
    "bossQuestionId": "q070",
    "bossBonusSeconds": 5,
    "difficulty": 4,
    "reward": {
      "first": {
        "freeze": 1
      },
      "perfect": {
        "fifty": 1
      }
    }
  },
  {
    "id": "L15",
    "name": "Balloon Master",
    "cefr": "B2+",
    "grammarTopic": "Advanced mixed grammar",
    "questionIds": [
      "q071",
      "q072",
      "q073",
      "q074",
      "q075"
    ],
    "timeLimitSeconds": 32,
    "choiceCount": 5,
    "movementPattern": "combo",
    "movementSpeed": 56,
    "bossQuestionId": "q075",
    "bossBonusSeconds": 5,
    "difficulty": 5,
    "reward": {
      "first": {
        "shield": 1,
        "freeze": 1
      },
      "perfect": {
        "fifty": 1,
        "shield": 1
      }
    }
  }
];
})(typeof window !== 'undefined' ? window : globalThis);
