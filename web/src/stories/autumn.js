// Based on the visible 2020 artwork; original fan-written dialogue, not official script.
export const autumnStories = {
  "startAutumn": {
    "goal": "autumn-ducklings",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先找回池边的小鸭子，坐下来听一听树荫里的风。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "小鸭游过水面，石阶上的两个人把这一阵凉风留了下来。"
    },
    "memories": [
      {
        "id": "autumn-ducklings",
        "name": "池边小鸭",
        "speaker": "小黑",
        "voice": "child",
        "text": "师父，它们排成一队啦！后面那只，快跟上。",
        "bounds": [
          0.04,
          0.85,
          0.91,
          0.98
        ],
        "effect": "rain",
        "icon": "leaf"
      },
      {
        "id": "autumn-watermelon",
        "name": "小黑的西瓜",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小黑捧着一片西瓜，目光却跟着小鸭游远了。",
        "bounds": [
          0.16,
          0.62,
          0.38,
          0.8
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "autumn-stone-guide",
        "name": "石阶上的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "不着急。坐一会儿，再往前走。",
        "bounds": [
          0.36,
          0.45,
          0.81,
          0.82
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "autumn-shade",
        "name": "石阶树荫",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "树荫顺着石阶铺下来，水面留着一层安静的绿。",
        "bounds": [
          0.02,
          0.17,
          0.98,
          0.6
        ],
        "effect": "wind",
        "icon": "leaf"
      }
    ]
  },
  "limitHeat": {
    "goal": "autumn-water-lights",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先找回水面的小灯，沿着灯影看向远处的小船。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "小船和灯影都拼回来了，夜色里便有了一条柔柔的亮路。"
    },
    "memories": [
      {
        "id": "autumn-water-lights",
        "name": "水面灯影",
        "speaker": "小黑",
        "voice": "child",
        "text": "像好多小星星，排着队从水上走过来。",
        "bounds": [
          0.04,
          0.27,
          0.43,
          0.6
        ],
        "effect": "glow",
        "icon": "flower"
      },
      {
        "id": "autumn-boat-guide",
        "name": "船上的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "先坐稳。灯影会慢慢漂过来。",
        "bounds": [
          0.37,
          0.03,
          0.65,
          0.2
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "autumn-boat-child",
        "name": "船边的小黑",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小黑望着水面，把亮亮的倒影看了又看。",
        "bounds": [
          0.58,
          0.08,
          0.8,
          0.26
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "autumn-night-water",
        "name": "静夜水纹",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "细细的水纹把光拉长，夜色也跟着轻轻摇晃。",
        "bounds": [
          0.38,
          0.49,
          0.99,
          0.99
        ],
        "effect": "rain",
        "icon": "leaf"
      }
    ]
  },
  "whiteDew": {
    "goal": "autumn-reed-plumes",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先拼回蓬松的芦穗，看看小黑在草间发现了什么。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "芦穗跟着秋风点头，两个人的身影也重新藏进了暖色里。"
    },
    "memories": [
      {
        "id": "autumn-reed-plumes",
        "name": "金色芦穗",
        "speaker": "小黑",
        "voice": "child",
        "text": "这些毛茸茸的穗子，像一大片小尾巴。",
        "bounds": [
          0.57,
          0.02,
          0.99,
          0.56
        ],
        "effect": "wind",
        "icon": "leaf"
      },
      {
        "id": "autumn-reed-guide",
        "name": "芦丛里的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "跟紧我，别让穗子挠到鼻子。",
        "bounds": [
          0.18,
          0.2,
          0.64,
          0.89
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "autumn-reed-child",
        "name": "芦丛里的小黑",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小黑眯起眼睛，脸颊边都是柔软的草穗。",
        "bounds": [
          0.56,
          0.63,
          0.98,
          0.99
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "autumn-reed-light",
        "name": "草间暖光",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "光从芦穗间穿过去，把整片草丛染得暖暖的。",
        "bounds": [
          0.01,
          0.14,
          0.34,
          0.88
        ],
        "effect": "glow",
        "icon": "leaf"
      }
    ]
  },
  "autumnEquinox": {
    "goal": "autumn-cotton-candy",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先找回小黑手里的棉花糖，秋天的小街热闹起来了。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "气球、糖果和笑脸都回来了，街上的每一步都像踩着快乐。"
    },
    "memories": [
      {
        "id": "autumn-cotton-candy",
        "name": "云朵棉花糖",
        "speaker": "小黑",
        "voice": "child",
        "text": "师父，我手里有两朵小云！你想先尝哪一朵？",
        "bounds": [
          0.23,
          0.31,
          0.79,
          0.44
        ],
        "effect": "glow",
        "icon": "flower"
      },
      {
        "id": "autumn-market-guide",
        "name": "街上的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "你先拿稳。人多，我们慢慢走。",
        "bounds": [
          0.28,
          0.42,
          0.7,
          0.92
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "autumn-red-balloon",
        "name": "红色气球",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "红气球浮在糖果摊前，细细的线一直牵到小黑手里。",
        "bounds": [
          0.51,
          0.12,
          0.7,
          0.39
        ],
        "effect": "wind",
        "icon": "leaf"
      },
      {
        "id": "autumn-market-friends",
        "name": "街头笑脸",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小店前挤满了笑脸，热闹从画面这头一直跑到那头。",
        "bounds": [
          0.01,
          0.66,
          0.99,
          0.99
        ],
        "effect": "glow",
        "icon": "flower"
      }
    ]
  },
  "coldDew": {
    "goal": "autumn-little-plane",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先拼回游乐场的小飞机，和小黑一起看看飘来的秋叶。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "小飞机和秋叶都回来了，小黑的笑声还留在高高的风里。"
    },
    "memories": [
      {
        "id": "autumn-little-plane",
        "name": "游乐小飞机",
        "speaker": "小黑",
        "voice": "child",
        "text": "师父，前面有片叶子！我们跟它打个招呼吧。",
        "bounds": [
          0.2,
          0.4,
          0.98,
          0.85
        ],
        "effect": "glow",
        "icon": "leaf"
      },
      {
        "id": "autumn-ride-guide",
        "name": "身后的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "扶好前面。我们在这儿也看得见。",
        "bounds": [
          0.18,
          0.18,
          0.61,
          0.52
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "autumn-ride-child",
        "name": "开心的小黑",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小黑戴着小帽子，眼睛亮得像要把秋天都装进去。",
        "bounds": [
          0.48,
          0.3,
          0.85,
          0.48
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "autumn-floating-leaves",
        "name": "空中秋叶",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "几片叶子翻着跟头，从蓝蓝的天空里慢慢落下。",
        "bounds": [
          0.04,
          0.02,
          0.98,
          0.25
        ],
        "effect": "wind",
        "icon": "leaf"
      }
    ]
  },
  "frostDescent": {
    "goal": "autumn-red-canopy",
    "opening": {
      "id": "opening",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "先找回满树的红叶，小桥上的秋天就要完整了。"
    },
    "ending": {
      "id": "complete",
      "speaker": "四时旁白",
      "voice": "adultFemale",
      "text": "红叶铺满枝头，小桥上两个小小的身影把秋色一路带向前。"
    },
    "memories": [
      {
        "id": "autumn-red-canopy",
        "name": "满树红叶",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "一层又一层的红叶，把天空围成了暖暖的小窗。",
        "bounds": [
          0.01,
          0.01,
          0.99,
          0.65
        ],
        "effect": "petals",
        "icon": "leaf"
      },
      {
        "id": "autumn-bridge-child",
        "name": "桥上的小黑",
        "speaker": "小黑",
        "voice": "child",
        "text": "师父，这片叶子像一只小手！",
        "bounds": [
          0.16,
          0.69,
          0.43,
          0.86
        ],
        "effect": "glow",
        "icon": "cat"
      },
      {
        "id": "autumn-bridge-guide",
        "name": "桥上的无限",
        "speaker": "无限",
        "voice": "adultMale",
        "text": "那就让它给秋天挥挥手。",
        "bounds": [
          0.58,
          0.64,
          0.84,
          0.86
        ],
        "effect": "glow",
        "icon": "mountain"
      },
      {
        "id": "autumn-red-bridge",
        "name": "红叶下的小桥",
        "speaker": "四时旁白",
        "voice": "adultFemale",
        "text": "小桥下面水纹轻轻晃着，像在替红叶收好倒影。",
        "bounds": [
          0.01,
          0.84,
          0.99,
          0.99
        ],
        "effect": "rain",
        "icon": "leaf"
      }
    ]
  }
};
