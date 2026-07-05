/* ============================================================
   AI GAME MASTER — Rule-based companion state engine
   ============================================================ */

(function() {
  const PERSONALITIES = ['playful','mischievous','strict','caring'];
  const ROOM_TYPES = ['shooting','searching','fighting','running','cooking'];

  const DIALOGS = {
    playful: {
      enter: ['Hey bestie! 🌸 Ready for this?','Ooh a new room! ✨ Let\'s go!','Yay! This one looks fun! 🌟','Bestie mode activated! 💖'],
      progress: ['You\'re doing amazing! 🌈','Keep going, bestie! 💪','So good! ✨ Almost there!','Looking great out there! 🌸'],
      hint: ['Try looking around~ 🌸','Maybe over there? 👀','Ooh ooh I see something! ✨','I believe in you bestie! 💪'],
      complete: ['NAILED IT! 🎉🌟','You\'re a superstar! 🌸✨','Bestie mode: UNLOCKED! 💖','CRUSHED IT! Amazing! 🌈'],
      death: ['Oh nooo! 😱 Try again bestie!','Not today! 🌸 You got this!','Oopsie! 💫 One more try~','It\'s okay! I\'m right here! 🌸'],
      finale: ['YOU DID IT ALL! 🎉🎉🎉 Bestie forever! 🌸✨🌟','CHAMPION! 🌈💖 So proud of you!','THE BEST BESTIE EVER! 🏆🎉']
    },
    mischievous: {
      enter: ['Hehe, let\'s see what we have here~','Oh this looks tricky! 😈','Good luck... you\'ll need it~','Don\'t mess up~ 😏'],
      progress: ['Too slow! 🏃‍♂️','Getting warmer... maybe~','Hehe nice try~','Is that all you got? 😏'],
      hint: ['Maybe try something crazy? 😈','I could tell you... but where\'s the fun?','Hmm hmm hmm~ I know something~','Nah, figure it out yourself~'],
      complete: ['WHAT?! You actually did it? 😱','Lucky... just lucky 😒','Fine, you\'re pretty good~','OK that was actually cool 😎'],
      death: ['Too slow! 😈 Try harder!','BUAHAHA nice fail~ 😂','Hehe try again~','Told you it was tricky~ 😏'],
      finale: ['No way... you actually beat it all? 😱 RESPECT!','OK OK you\'re good! Hehe congrats~ 😈','You\'re... actually impressive. Don\'t let it get to your head 😏']
    },
    strict: {
      enter: ['Focus. This is a serious mission.','Atten-tion! Room ahead.','No mistakes this time, soldier.','Eyes forward. Let\'s move.'],
      progress: ['Acceptable. Keep going.','Faster. Better. Now.','Disappointing... no wait, improving.','Steady progress. Maintain.'],
      hint: ['Analyze your surroundings.','Strategy over instinct.','Follow protocol.','Observe and adapt.'],
      complete: ['Acceptable.','Well done. That was adequate.','Standards met. Proceed.','Satisfactory performance.'],
      death: ['Disappointing... Restart and improve.','Failure is not an option. Try again.','Unacceptable. Again.','You call that effort? Again.'],
      finale: ['Mission complete. You pass. ...That\'s high praise.','All objectives cleared. You\'ve earned your stripes.','Impressive. Truly impressive.']
    },
    caring: {
      enter: ['You\'ve got this 💕 Take your time~','Be careful in there, okay? 🌸','I believe in you! 🥰 Go ahead!','I\'m right here with you 💕'],
      progress: ['You\'re doing so well! 💕','Almost there, keep going! 🌸','So proud of you! 🥹','You\'re amazing! Don\'t stop!'],
      hint: ['Be careful around the corners 💕','Take your time, no rush~ 🌸','You\'re doing great, just breathe 🫂','I know you can do this! 🥰'],
      complete: ['Amazing! I knew you could do it! 💕🌸','PERFECT! You\'re incredible! 🥰','So so proud of you! 🥹💕','You never cease to amaze me! ✨'],
      death: ['Oh no! 💔 It\'s okay, try again! You\'ve got this! 🫂💕','Don\'t give up! I\'m right here with you! 🌸','Shake it off! You can do it! 🥰','It\'s okay to fall... what matters is getting back up 💕'],
      finale: ['You did EVERYTHING! I\'m so so proud of you! 🥹💕🌸✨','What a journey! You\'re unstoppable! 🥰💖','My heart is so full! You\'re incredible! 💕🥹']
    }
  };

  function generateConfig(type) {
    switch(type) {
      case 'shooting':
        return {
          type:'shooting', difficulty:['easy','medium','hard'][Math.floor(Math.random()*3)],
          targetCount:3+Math.floor(Math.random()*6), targetSpeed:0.3+Math.random()*1.2,
          timeLimit:15+Math.floor(Math.random()*31), spawnPattern:['random','wave','circle'][Math.floor(Math.random()*3)],
          layoutSeed:Math.random()*10000
        };
      case 'searching':
        return {
          type:'searching', difficulty:['easy','medium','hard'][Math.floor(Math.random()*3)],
          keyCount:1+Math.floor(Math.random()*4), roomDarkness:0.3+Math.random()*0.6,
          flashlightBattery:30+Math.floor(Math.random()*71), timeLimit:30+Math.floor(Math.random()*61),
          layoutSeed:Math.random()*10000
        };
      case 'fighting':
        return {
          type:'fighting', difficulty:['easy','medium','hard'][Math.floor(Math.random()*3)],
          laserCount:3+Math.floor(Math.random()*10), laserSpeed:0.5+Math.random()*1.5,
          duration:10+Math.floor(Math.random()*16), pulsePattern:['random','sweep','grid'][Math.floor(Math.random()*3)],
          layoutSeed:Math.random()*10000
        };
      case 'running':
        return {
          type:'running', difficulty:['easy','medium','hard'][Math.floor(Math.random()*3)],
          corridorLength:50+Math.floor(Math.random()*151), obstacleDensity:0.3+Math.random()*0.5,
          speed:3+Math.random()*5, turns:Math.random()>0.5,
          layoutSeed:Math.random()*10000
        };
      case 'cooking':
        return {
          type:'cooking', difficulty:['easy','medium','hard'][Math.floor(Math.random()*3)],
          ingredientCount:4+Math.floor(Math.random()*5), fallSpeed:1+Math.random()*2,
          sequenceLength:3+Math.floor(Math.random()*4), timeLimit:15+Math.floor(Math.random()*16),
          layoutSeed:Math.random()*10000
        };
      default:
        return {type, layoutSeed:Math.random()*10000};
    }
  }

  window.GM = {
    personality: 'playful',
    roomOrder: [],
    roomTypes: ROOM_TYPES,
    currentRoom: 0,
    personalities: PERSONALITIES,
    _configs: [],

    newRun() {
      this.personality = this.pick(this.personalities, 1)[0];
      this.roomOrder = this.shuffle([0,1,2,3,4]);
      this.currentRoom = 0;
      this._configs = this.roomTypes.map(function(t) { return generateConfig(t); });
    },

    getRoomConfig(idx) {
      if(idx >= 0 && idx < this._configs.length) return this._configs[idx];
      return generateConfig(this.roomTypes[idx] || 'shooting');
    },

    getDialog(context) {
      var pd = DIALOGS[this.personality] || DIALOGS.playful;
      var opts = pd[context] || ['...'];
      return this.pick(opts, 1)[0];
    },

    shuffle(arr) {
      var a = arr.slice();
      for(var i=a.length-1; i>0; i--) {
        var j = Math.floor(Math.random() * (i+1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    },

    pick(arr, n) {
      var s = this.shuffle(arr.slice());
      return s.slice(0, n);
    }
  };
})();
