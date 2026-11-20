// Based on the visible 2020 artwork; original fan-written dialogue, not official script.
export const winterStories = {
  "startWinter": {
    "goal": "winter-hot-spring",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先拼回温暖的水面，看看石头后面的小黑。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "水汽、落叶和茶盏都回来了，初冬也有了暖暖的歇脚处。"
    },
    "memories": [
      {
        "id": "winter-hot-spring",
        "name": "暖暖的水汽",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "温热的水面浮着薄薄的雾，把初冬的风隔得远远的。",
        "bounds": [
          0.02,
          0.33,
          0.98,
          0.79
        ],
        "effect": "rain",
        "icon": "leaf"
      },
      {
        "id": "winter-bathing-guide",
        "name": "歇息的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "外面凉了，先在这里暖一会儿。",
        "bounds": [
          0.43,
          0.2,
          0.83,
          0.47
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "winter-stone-child",
        "name": "石头后的小黑",
        "speaker": "小黑",
        "voice": "child",
        "text": "师父，落叶也来跟我们一起歇脚啦。",
        "bounds": [
          0.26,
          0.66,
          0.56,
          0.85
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "winter-tea-tray",
        "name": "水边茶盏",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "茶盘停在水面上，几片红叶从枝头轻轻落下来。",
        "bounds": [
          0.62,
          0.4,
          0.86,
          0.48
        ],
        "effect": "glow",
        "icon": "leaf"
      }
    ]
  },
  "minorSnow": {
    "goal": "winter-warm-scarf",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先把小黑的围巾拼回来，再看看落在伞边的小雪花。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "围巾裹好了，小雪还在飘，他们把暖意一起带进了冬天。"
    },
    "memories": [
      {
        "id": "winter-warm-scarf",
        "name": "软软围巾",
        "speaker": "小黑",
        "voice": "child",
        "text": "这条围巾，把风都挡在外面啦！",
        "bounds": [
          0.13,
          0.65,
          0.98,
          0.98
        ],
        "effect": "glow",
        "icon": "leaf"
      },
      {
        "id": "winter-snow-guide",
        "name": "雪中的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "再往里缩一点，耳朵也要暖和。",
        "bounds": [
          0.12,
          0.09,
          0.72,
          0.6
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "winter-snow-child",
        "name": "抬头的小黑",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小黑把脸埋在围巾边，只留一双亮亮的眼睛看雪。",
        "bounds": [
          0.4,
          0.39,
          0.94,
          0.75
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "winter-umbrella-snow",
        "name": "伞边细雪",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "细小的雪花落过透明的伞，像冬天悄悄写下的字。",
        "bounds": [
          0.01,
          0.01,
          0.98,
          0.35
        ],
        "effect": "wind",
        "icon": "umbrella"
      }
    ]
  },
  "majorSnow": {
    "goal": "winter-snowman",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先拼好雪人的脸，看看大家给它画了什么表情。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "雪人站好了，树下的伙伴们也把各自的表情留在了冬天里。"
    },
    "memories": [
      {
        "id": "winter-snowman",
        "name": "歪眉毛雪人",
        "speaker": "小黑",
        "voice": "child",
        "text": "眉毛歪一点，才像刚睡醒嘛！",
        "bounds": [
          0.37,
          0.37,
          0.73,
          0.72
        ],
        "effect": "glow",
        "icon": "leaf"
      },
      {
        "id": "winter-snowman-guide",
        "name": "雪人后的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "好。那这边的眉毛，就交给你了。",
        "bounds": [
          0.62,
          0.24,
          0.94,
          0.69
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "winter-snowman-friends",
        "name": "同行的小伙伴",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "同行的姑娘抱着手臂，小黑却在雪人旁边笑得停不下来。",
        "bounds": [
          0.1,
          0.36,
          0.77,
          0.94
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "winter-snowy-trees",
        "name": "白雪树林",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "树枝披着一层白，热闹的声音从安静的树林里冒出来。",
        "bounds": [
          0.01,
          0.01,
          0.98,
          0.3
        ],
        "effect": "wind",
        "icon": "leaf"
      }
    ]
  },
  "winterSolstice": {
    "goal": "winter-footprints",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先找回雪地里的脚印，看看小黑把步子迈到了哪里。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "一串脚印连起两个身影，雪地上也有了可以慢慢走的小路。"
    },
    "memories": [
      {
        "id": "winter-footprints",
        "name": "雪地脚印",
        "speaker": "小黑",
        "voice": "child",
        "text": "师父，我的脚印，能不能走到你的脚印里面？",
        "bounds": [
          0.36,
          0.7,
          0.94,
          0.99
        ],
        "effect": "glow",
        "icon": "leaf"
      },
      {
        "id": "winter-snowfield-guide",
        "name": "回望的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "可以。慢慢来，我在这里等你。",
        "bounds": [
          0.28,
          0.09,
          0.6,
          0.47
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "winter-snowfield-child",
        "name": "雪地小黑",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小黑裹着冬衣，小小的身影在雪地里格外认真。",
        "bounds": [
          0.57,
          0.46,
          0.86,
          0.7
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "winter-red-branches",
        "name": "雪间红枝",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "细细的枝条点着红色，给白茫茫的画面添上一点暖。",
        "bounds": [
          0.57,
          0.22,
          0.81,
          0.43
        ],
        "effect": "glow",
        "icon": "leaf"
      }
    ]
  },
  "minorCold": {
    "goal": "winter-steamer",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先拼回热气腾腾的蒸笼，陪他们在小店里暖暖手。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "热气和笑脸都拼好了，小寒也被这一笼暖意轻轻包住。"
    },
    "memories": [
      {
        "id": "winter-steamer",
        "name": "暖暖蒸笼",
        "speaker": "小黑",
        "voice": "child",
        "text": "师父，热气像一朵小云，从笼子里冒出来啦。",
        "bounds": [
          0.22,
          0.53,
          0.82,
          0.89
        ],
        "effect": "glow",
        "icon": "leaf"
      },
      {
        "id": "winter-shop-guide",
        "name": "小店里的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "小心烫。先吹一吹，再慢慢吃。",
        "bounds": [
          0.15,
          0.23,
          0.61,
          0.65
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "winter-shop-child",
        "name": "期待的小黑",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小黑靠在师父身旁，把香气和期待一起装进笑脸里。",
        "bounds": [
          0.52,
          0.34,
          0.97,
          0.65
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "winter-warm-shop",
        "name": "窗边暖色",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "桌椅和墙面染着柔和的暖色，把外头的寒意留在门外。",
        "bounds": [
          0.03,
          0.03,
          0.98,
          0.24
        ],
        "effect": "glow",
        "icon": "leaf"
      }
    ]
  },
  "majorCold": {
    "goal": "winter-lanterns",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先点亮街上的灯笼，小黑已经把热闹举到了头顶。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "灯笼、笑脸和远处的烟花都回来了，一年的旅程也暖暖地走到了这里。"
    },
    "memories": [
      {
        "id": "winter-lanterns",
        "name": "长街灯笼",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "一盏又一盏灯笼，把冬夜的小街照得暖洋洋的。",
        "bounds": [
          0.02,
          0.01,
          0.98,
          0.48
        ],
        "effect": "glow",
        "icon": "leaf"
      },
      {
        "id": "winter-festival-child",
        "name": "肩上的小黑",
        "speaker": "小黑",
        "voice": "child",
        "text": "师父，我从这里看见好多好多灯！",
        "bounds": [
          0.32,
          0.5,
          0.71,
          0.7
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "winter-festival-guide",
        "name": "灯下的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "坐稳了。我们一起慢慢看。",
        "bounds": [
          0.31,
          0.67,
          0.72,
          0.99
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "winter-candied-fruit",
        "name": "手中糖葫芦",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小黑举着一串糖葫芦，甜甜的颜色也跟着灯光亮起来。",
        "bounds": [
          0.26,
          0.43,
          0.46,
          0.67
        ],
        "effect": "glow",
        "icon": "flower"
      }
    ]
  }
};
