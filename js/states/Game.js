var FartyTurd = FartyTurd || {};

FartyTurd.GameState = {

  init: function() {
    
    //pool of pipes
    this.pipePool = this.add.group();
    
    //gravity
    this.game.physics.arcade.gravity.y = 1000;    
    
    //max jump distance
    this.maxJumpDistance = 120;
    
    //move player with up key
    this.cursors = this.game.input.keyboard.createCursorKeys();
    
    //score 
    this.currentScore = 0;
    
    //speed level
    this.levelSpeed = 100;
  },
  create: function() {
    //moving background
    this.background = this.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'background');
    this.background.tileScale.y = 2.75;
    this.background.tileScale.x = 2.75;
    this.background.autoScroll(-this.levelSpeed/6, 0);
    this.game.world.sendToBack(this.background);
            
    //create the player
    this.player = this.add.sprite(50, 140, 'turd');
    this.player.anchor.setTo(0.5);
    this.game.physics.arcade.enable(this.player);
    
    //change player bounding box
    this.player.body.setSize(32, 24, 0, 0);
    
    //hard-code first pipe
    this.currentPipe = new FartyTurd.Pipe(this.game, 250, 0, -this.levelSpeed, this.generateRandomPipe());
    this.pipePool.add(this.currentPipe);

    this.fart = this.game.add.sprite(20, 170, 'fart');
    this.fart.customParams = {
      offset: {
        x: -30,
        y: 28
      }
    };
    this.game.physics.arcade.enable(this.fart);
    this.fart.allowGravity = false;
    this.fart.body.velocity.x = -this.levelSpeed;
    this.fart.anchor.setTo(0.5);
    this.fart.kill();
    
    //fart sound
    this.fartSound = this.add.audio('fartSound');
    this.fartSound.isPlaying = false;
    this.fartSound.onPlay.add(function (s) {
      s.isPlaying = true;
      this.fart.reset(this.player.x + this.fart.customParams.offset.x, this.player.y + this.fart.customParams.offset.y);
    }, this);
    this.fartSound.onStop.add(function (s) {
      s.isPlaying = false;
      this.fart.kill();
    }, this);
    
    this.createPipe();
    
    //moving ground
    this.ground = this.add.tileSprite(0, this.game.world.height - 30, this.game.world.width, 30, 'ground');
    this.ground.autoScroll(-this.levelSpeed/2, 0);
    
    //show number of coins
    var style = {font: '30px Arial', fill: '#fff'};
    this.fartCountLabel = this.add.text(10, 20, '0', style);
  },   
  update: function() {    
    if(this.player.alive) {
      this.pipePool.forEachAlive(function(pipe, index){
        this.game.physics.arcade.overlap(this.player, pipe, this.gameOver, null, this);

        if(!pipe.isScored && pipe.length && pipe.children[0].right < this.player.left) {
          this.incrementScore();
          pipe.isScored = true;
        }

        //check if a pipe needs to be killed
        if(pipe.length && pipe.children[0].right < 0) {
          pipe.kill();
        }    

      }, this);

      if(this.cursors.up.isDown || this.game.input.activePointer.isDown) {
        this.playerJump();
        if (!this.fartSound.isPlaying) {
          this.fartSound.play();
        }
      }

      if(this.currentPipe.length && this.currentPipe.children[0].right < this.game.world.width) {
        this.createPipe();
      }
      
      //check if the player needs to die
      if(this.player.bottom >= this.ground.top) {
        this.gameOver();
      }
    }
     
  },
  incrementScore: function () {
    this.currentScore++;
    this.fartCountLabel.text = this.currentScore;
  },
  playerJump: function(){
    this.player.body.velocity.y = -150;
  },
  createPipe: function(){
    var nextPipeData = this.generateRandomPipe();
      
    this.currentPipe = this.pipePool.getFirstDead();
    
    if(!this.currentPipe) {
      this.currentPipe = new FartyTurd.Pipe(this.game, this.game.world.width + nextPipeData.separation, 0, -this.levelSpeed, nextPipeData);   
    } else {
      this.currentPipe.configure(this.game.world.width + nextPipeData.separation, 0, -this.levelSpeed, nextPipeData);   
    }

    this.pipePool.add(this.currentPipe);
  },
  generateRandomPipe: function() {
    var data = {};
    
    //distance from the previous pipe
    var minSeparation = 50;
    var maxSeparation = 180;
    data.separation = minSeparation + Math.random() * (maxSeparation - minSeparation);

    // gap size
    var minSize = 80;
    var maxSize = 130;
    data.gapSize = minSize + Math.random() * (maxSize - minSize);
      
    return data;
  },
  gameOver: function(){
    this.player.kill();    
    this.updateHighscore();
    
    //game over overlay
    this.overlay = this.add.bitmapData(this.game.width, this.game.height);
    this.overlay.ctx.fillStyle = '#000';
    this.overlay.ctx.fillRect(0, 0, this.game.width, this.game.height);
    
    //sprite for the overlay
    this.panel = this.add.sprite(0, this.game.height, this.overlay);
    this.panel.alpha = 0.55;
    
    //overlay raising tween animation
    var gameOverPanel = this.add.tween(this.panel);
    gameOverPanel.to({y: 0}, 500);
    
    //stop all movement after the overlay reaches the top
    gameOverPanel.onComplete.add(function(){
      this.ground.stopScroll();
      this.background.stopScroll();
      
      var style = {font: '30px Arial', fill: '#fff'};
      this.add.text(this.game.width/2, this.game.height/2, 'GAME OVER', style).anchor.setTo(0.5);
      
      style = {font: '20px Arial', fill: '#fff'};
      this.add.text(this.game.width/2, this.game.height/2 + 50, 'High score: ' + this.highScore, style).anchor.setTo(0.5);
      
      this.add.text(this.game.width/2, this.game.height/2 + 80, 'Your score: ' + this.currentScore, style).anchor.setTo(0.5);
      
      style = {font: '10px Arial', fill: '#fff'};
      this.add.text(this.game.width/2, this.game.height/2 + 120, 'Tap to play again', style).anchor.setTo(0.5);
      
      this.game.input.onDown.addOnce(this.restart, this);
      
      
    }, this);
    
    gameOverPanel.start();
    
  },
  restart: function(){
    //current bug with tileSprite on v2.3, have to manually remove the sprites from the world before launching a different state
    //http://www.html5gamedevs.com/topic/13843-events-linger-after-remove-and-destroy/
    this.game.world.remove(this.background);
    this.game.world.remove(this.ground);
    
    this.game.state.start('Game');
  },
  updateHighscore: function(){
    this.highScore = +localStorage.getItem('highScore');
    
    //do we have a new high score
    if(this.highScore < this.currentScore){
      this.highScore = this.currentScore;
      
      //save new high score
      localStorage.setItem('highScore', this.highScore);
    }
  }

  
  /*render: function() {
    this.game.debug.body(this.player);
    this.game.debug.bodyInfo(this.player, 0, 30);
  }*/
};
