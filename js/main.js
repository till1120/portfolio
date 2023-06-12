//////////////////////////////////////////////////////////////////////
//
//	 Title			：まるばつゲーム
//	 Filename		：main.js
//	 Abstract		：まるばつゲームだよ
//
//
//////////////////////////////////////////////////////////////////////

"use strict";

//定数
//デバッグモード(0:OFF 1:ON)
const DEBUG_MODE = 1;

//INIT:初期に代入する定数、ILLEGAL:問題が発生した場合に代入する定数
const INIT      = 1001;
const ILLEGAL   = 999;

//ウインドウサイズ
const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 600;

//プレイヤーとエネミー
const PLAYER = 0;
const ENEMY = 1;

//版の場所
const TOP_LEFT      = 0; const TOP_CENTER    = 1; const TOP_RIGHT     = 2;
const MIDDLE_LEFT   = 3; const MIDDLE_CENTER = 4; const MIDDLE_RIGHT  = 5;
const BOTTOM_LEFT   = 6; const BOTTOM_CENTER = 7; const BOTTOM_RIGHT  = 8;

const TOP_LEFT_0_X = 0; const TOP_LEFT_200_X = 200; const TOP_LEFT_400_X = 400; const TOP_LEFT_600_X = 600;
const TOP_LEFT_0_Y = 0; const TOP_LEFT_200_Y = 200; const TOP_LEFT_400_Y = 400; const TOP_LEFT_600_Y = 600;

//中心から隣フィールドの中心までの距離
const FIELD_DISTANCE = 144;

//フィールドの状態
const SPACE = 0;
const MARU = 1;
const BATSU = 2;

//線の位置
const LINE_3D_X = 83; const LINE_3D_Z = 83;

//現在の状態
const STATE_INIT          =     0;  //初期化中
const STATE_ORDER         =     1;  //順番決め中
const STATE_TURN_1        =     2;  //1手目
const STATE_TURN_2        =     3;  //2手目
const STATE_TURN_3        =     4;  //3手目
const STATE_TURN_4        =     5;  //4手目
const STATE_TURN_5        =     6;  //5手目
const STATE_TURN_6        =     7;  //6手目
const STATE_TURN_7        =     8;  //7手目
const STATE_TURN_8        =     9;  //8手目
const STATE_TURN_9        =     10; //9手目
const STATE_PLAYER_TURN   =     11; //プレイヤーのターン
const STATE_ENEMY_TURN    =     12; //相手のターン
const STATE_JUDGE         =     13; //判定中
const STATE_RESULT        =     14; //勝負結果
const STATE_REMATCH_INIT  =     15; //再戦初期化中
const STATE_END           =     16; //終了

//マルとバツのモデル番号
const MODEL_MARU_0	= 0; const MODEL_BATSU_1	= 0;
const MODEL_MARU_2	= 1; const MODEL_BATSU_3	= 1;
const MODEL_MARU_4	= 2; const MODEL_BATSU_5	= 2;
const MODEL_MARU_6	= 3; const MODEL_BATSU_7	= 3;
const MODEL_MARU_8	= 4;

//音楽関連
//music
const MUSIC_BATTLE_START = 'media/audio/001_kurokiyo.mp3';
const MUSIC_RESULT = 'media/audio/002_winter_tears.mp3';

//SE
const SE_CLAP = 'media/audio/101_clap.wav';
const SE_SELECT = 'media/audio/102_select.wav';
const SE_VICTORY = 'media/audio/103_victory.wav';

///////////////////////////////////////////////////////////
//	Method      : play_game
//	Summary     : html内で呼び出してゲーム実行
//	Arguments   : 
//              : 
//	Return      : なし
//	Note        : 
///////////////////////////////////////////////////////////
function play_game()
{
    //マルバツゲーム実行
    let game = new MainGame();

    //デバッグモード
    if(DEBUG_MODE)
    {
        //console.log(game.field[TOP_LEFT]);
        //console.log(game.current_state);  
    }
}

///////////////////////////////////////////////////////////
//	Method      : MainGame
//	Summary     : ゲームの初期化とかゲーム進行とか管理するクラス
//	Arguments   : 
//              : 
//	Return      : なし
//	Note        : 
///////////////////////////////////////////////////////////
class MainGame
{
    //プロパティ

    //レンダラー
    renderer;

    //シーン
    scene;

    //カメラ
    camera;

    //カメラのコントロール
    controls;

    //現在の状態
    current_state = INIT;

    //フィールドのデータ
    field = [];

    //勝者
    winner = INIT;

    //<canvas id="draw3D">になにかするとき用
    canvas_object;

    //<p id="state">になにかするとき用
    state_text;

    //音楽
    music;

    //SE
    sound_effect;

    //音楽ボタン
    music_button;

    //点光源の赤と緑、ぐるぐるフィールドを回る
	point_light_red;
	point_light_green;

    //点光源、マウスを追っていく
	point_light_mouse;

    //点光源、マウスがあるフィールドを照らす
    point_light_select_field;

    //○のモデル、合計５個
	model_maru = [];

    //☓のモデル、線とクロスさせてバツを表現、合計４個
	model_batu1 = [];
	model_batu2 = [];

    ///////////////////////////////////////////////////////////
    //	Method      : constructor
    //	Summary     : 初期化（モデル作成とかプロパティ設定とか）
    //	Arguments   : 
    //              : 
    //	Return      : なし
    //	Note        : 
    ///////////////////////////////////////////////////////////
    constructor()
    {
        //初期化中
        this.current_state = STATE_INIT;

        //データーフィールド初期化
        this.field[TOP_LEFT]    = SPACE; this.field[TOP_CENTER]     = SPACE; this.field[TOP_RIGHT]      = SPACE;
        this.field[MIDDLE_LEFT] = SPACE; this.field[MIDDLE_CENTER]  = SPACE; this.field[MIDDLE_RIGHT]   = SPACE;
        this.field[BOTTOM_LEFT] = SPACE; this.field[BOTTOM_CENTER]  = SPACE; this.field[BOTTOM_RIGHT]   = SPACE;

        //canvas(id = "draw3D")内のマウスクリック＆マウス移動を受け取れるようにする
        //.bind(this)でバインドし、このインスタンスのみに反応
        this.canvas_object = document.getElementById('draw3D');
        this.canvas_object.addEventListener('click', this.clickEvent.bind(this));
        this.canvas_object.addEventListener('mousemove', this.moveEvent.bind(this));

        //テキストボックス
		this.state_text = document.getElementById('state');
        this.state_text.addEventListener('click', this.rematch.bind(this));
		this.state_text.textContent = '初期化中';

        //3D表示の初期処理
        this.draw3D_Init(WINDOW_WIDTH, WINDOW_HEIGHT);

        //未実装
        //順番決め中
        //this.current_state = STATE_ORDER;
        //先行・後攻を選ぶ
        //this.order();

        //player vs player
        //player vs cpu
        //cpu vs cpu
        //も実装したいけど時間ない

        //勝負開始
        this.current_state = STATE_TURN_1;
        this.state_text.textContent = '先手○の番です。置きたい場所をクリックかタップしてねミ☆';

        //音楽の準備
        //music
        this.music = new Audio(MUSIC_BATTLE_START);
        this.music.load();
        this.music.muted = true;
        this.music.loop = true;
        this.music.controls = true;
        this.music_button = document.getElementById('audio');
        this.music_button.addEventListener('click', this.musicEvent.bind(this));

        //se
        this.sound_effect = new Audio(SE_CLAP);
        this.sound_effect.load();
        this.sound_effect.muted = true;
        this.sound_effect.loop = false;
        this.sound_effect.controls = true;
    }

    ///////////////////////////////////////////////////////////
    //	Method      : musicEvent
    //	Summary     : 音楽ボタンを押した時の処理
    //	Arguments   : 
    //              : 
    //	Return      : 
    //	Note        : 
    ///////////////////////////////////////////////////////////
    musicEvent()
    {
        if(this.music.muted)
        {
            this.music.muted = false;
            this.music.play();    
            this.music_button.textContent = '音楽停止⏸ ';

            this.sound_effect.muted = false;
        }
        else
        {
            this.music.muted = true;
            this.music.pause();
            this.music_button.textContent = '音楽再生▶';

            this.sound_effect.muted = true;
        }
    }

    ///////////////////////////////////////////////////////////
    //	Method      : fieldPosition
    //	Summary     : canvas内のマウス場所特定
    //	Arguments   : 
    //              : 
    //	Return      : フィールドを9個に分割したどこか
    //	Note        : 
    ///////////////////////////////////////////////////////////
    fieldPosition()
    {
        let field_pos;
        //左上（TOP_LEFT）
        if( event.offsetX > TOP_LEFT_0_X && event.offsetX < TOP_LEFT_200_X &&
            event.offsetY > TOP_LEFT_0_Y && event.offsetY < TOP_LEFT_200_Y)
        {
            field_pos = TOP_LEFT;
        }
        //中上（TOP_CENTER）
        else if(event.offsetX > TOP_LEFT_200_X && event.offsetX < TOP_LEFT_400_X &&
                event.offsetY > TOP_LEFT_0_Y && event.offsetY < TOP_LEFT_200_Y)
        {
            field_pos = TOP_CENTER;
        }
        //右上（TOP_CENTER）
        else if(event.offsetX > TOP_LEFT_400_X && event.offsetX < TOP_LEFT_600_X &&
            event.offsetY > TOP_LEFT_0_Y && event.offsetY < TOP_LEFT_200_Y)
        {
            field_pos = TOP_RIGHT;
        }
        //左中（MIDDLE_LEFT）
        else if(event.offsetX > TOP_LEFT_0_X && event.offsetX < TOP_LEFT_200_X &&
                event.offsetY > TOP_LEFT_200_Y && event.offsetY < TOP_LEFT_400_Y)
        {
            field_pos = MIDDLE_LEFT;
        }
        //中中（MIDDLE_CENTER）
        else if(event.offsetX > TOP_LEFT_200_X && event.offsetX < TOP_LEFT_400_X &&
            event.offsetY > TOP_LEFT_200_Y && event.offsetY < TOP_LEFT_400_Y)
        {
            field_pos = MIDDLE_CENTER;
        }
        //右中（MIDDLE_RIGHT）
        else if(event.offsetX > TOP_LEFT_400_X && event.offsetX < TOP_LEFT_600_X &&
            event.offsetY > TOP_LEFT_200_Y && event.offsetY < TOP_LEFT_400_Y)
        {
            field_pos = MIDDLE_RIGHT;
        }
        //左下（BOTTOM_LEFT）
        else if(event.offsetX > TOP_LEFT_0_X && event.offsetX < TOP_LEFT_200_X &&
                event.offsetY > TOP_LEFT_400_Y && event.offsetY < TOP_LEFT_600_Y)
        {
            field_pos = BOTTOM_LEFT;
        }
        //中下（BOTTOM_CENTER）
        else if(event.offsetX > TOP_LEFT_200_X && event.offsetX < TOP_LEFT_400_X &&
                event.offsetY > TOP_LEFT_400_Y && event.offsetY < TOP_LEFT_600_Y)
        {
            field_pos = BOTTOM_CENTER;
        }
        //右下（BOTTOM_RIGHT）
        else if(event.offsetX > TOP_LEFT_400_X && event.offsetX < TOP_LEFT_600_X &&
                event.offsetY > TOP_LEFT_400_Y && event.offsetY < TOP_LEFT_600_Y)
        {
            field_pos = BOTTOM_RIGHT;
        }
        else
        {
            field_pos = ILLEGAL;
        }

        return field_pos;
    }

    ///////////////////////////////////////////////////////////
    //	Method      : clickEvent
    //	Summary     : クリックしたときのイベント
    //	Arguments   : 
    //              : 
    //	Return      : 
    //	Note        : ゲーム進行によって呼び出す関数を変える
    ///////////////////////////////////////////////////////////
    clickEvent()
    {
        //クリックした場所を特定
        let field_pos = ILLEGAL;
        field_pos = this.fieldPosition();

        //○か☓があるなら何もしない　または
        //STATE_INITならなにもしない
        if( this.field[field_pos] != SPACE ||
            this.current_state === STATE_REMATCH_INIT)
        {
            return;
        }

        if(field_pos >= TOP_LEFT && field_pos <= BOTTOM_RIGHT)
        {
            //○・☓を生成
            this.displayMarubatsu(field_pos);

            //データーフィールド上を上書き
            let judge = INIT;
            switch(this.current_state)
            {
                case STATE_TURN_1:
                case STATE_TURN_3:
                case STATE_TURN_5:
                case STATE_TURN_7:
                case STATE_TURN_9:
                    this.field[field_pos] = MARU;
                    judge = MARU;
                    break;
                case STATE_TURN_2:
                case STATE_TURN_4:
                case STATE_TURN_6:
                case STATE_TURN_8:
                    this.field[field_pos] = BATSU;
                    judge = BATSU;
                    break;
            }

            switch(this.current_state)
            {
                case STATE_TURN_5:
                case STATE_TURN_6:
                case STATE_TURN_7:
                case STATE_TURN_8:
                case STATE_TURN_9:
                    //勝敗判定
                    this.judgeGame(judge);
                    break;
            }

            //勝者が出たらリザルト処理
            if( this.winner === MARU ||
                this.winner === BATSU)
            {
                if(DEBUG_MODE)
                {
                    console.log('winner',this.winner);
                }
                let win = '勝者：☓！';
                if(this.winner === MARU)
                {
                    win = '勝者：○！';
                }
                win += '続けたい場合は→[ココ]←を押してね';

                this.state_text.textContent = win;
                this.current_state = STATE_RESULT;

                //音楽切り替え
                this.music.pause();
                this.music.src = MUSIC_RESULT;
                this.music.play();

                //SE再生
                this.sound_effect.src = SE_VICTORY;
                this.sound_effect.play();

                return;
            }

            //引き分けの処理
            if(this.current_state === STATE_TURN_9)
            {
                this.state_text.textContent = '引き分け！続けたい場合は→[ココ]←を押してね';
                this.current_state = STATE_RESULT;

                return;
            }

            //ターンを進める
            this.current_state++;

            //SE再生
            this.sound_effect.src = SE_CLAP;
            this.sound_effect.play();

            //テキスト更新
            switch(this.current_state)
            {
                case STATE_TURN_3:
                case STATE_TURN_5:
                case STATE_TURN_7:
                    this.state_text.textContent = '先手○の番です。置きたい場所をクリックかタップしてねミ☆';
                    break;

                case STATE_TURN_2:
                case STATE_TURN_4:
                case STATE_TURN_6:
                    this.state_text.textContent = '後手☓の番です。置きたい場所をクリックかタップしてね★ミ';
                    break;
            }
        }

        //デバッグモード
        if(DEBUG_MODE)
        {
            console.log('click');
            console.log(event.offsetX, event.offsetY);
            console.log('this.field[field_pos]', this.field[field_pos]);  
            console.log('--------');  
        }
    }

    ///////////////////////////////////////////////////////////
    //	Method      : rematch
    //	Summary     : 再戦の初期化処理
    //	Arguments   : 
    //              : 
    //	Return      : 
    //	Note        : 
    ///////////////////////////////////////////////////////////
    rematch()
    {
        //キーボード入力を受け付けてくれない、なぜだヽ(`Д´)ﾉﾌﾟﾝﾌﾟﾝ
        if(this.current_state === STATE_RESULT)
        {
            //初期化処理
            this.current_state = STATE_REMATCH_INIT;

            this.winner = INIT;

            //データーフィールド初期化
            this.field[TOP_LEFT]    = SPACE; this.field[TOP_CENTER]     = SPACE; this.field[TOP_RIGHT]      = SPACE;
            this.field[MIDDLE_LEFT] = SPACE; this.field[MIDDLE_CENTER]  = SPACE; this.field[MIDDLE_RIGHT]   = SPACE;
            this.field[BOTTOM_LEFT] = SPACE; this.field[BOTTOM_CENTER]  = SPACE; this.field[BOTTOM_RIGHT]   = SPACE;

            this.state_text = document.getElementById('state');
            this.state_text.textContent = '初期化中';

            //マルとバツを隠す
            for(let imaru = MODEL_MARU_0; imaru <= MODEL_MARU_8; imaru++)
            {
                this.model_maru[imaru].position.y = 1200;
                this.model_maru[imaru].position.y = -200;
                this.model_maru[imaru].position.y = 1200;
                if(DEBUG_MODE)
                {
                    console.log('testmaru' + imaru);
                }
            }

            for(let ibatu = MODEL_BATSU_1; ibatu <= MODEL_BATSU_7; ibatu++)
            {
                this.model_batu1[ibatu].position.x = 1200;
                this.model_batu1[ibatu].position.y = -200;
                this.model_batu1[ibatu].position.z = 1200;
                this.model_batu2[ibatu].position.x = 1200;
                this.model_batu2[ibatu].position.y = -200;
                this.model_batu2[ibatu].position.z = 1200;
                if(DEBUG_MODE)
                {
                    console.log('testbatsu' + ibatu);
                }
            }

            //勝負開始
            this.current_state = STATE_TURN_1;

            this.state_text.textContent = '先手○の番です。置きたい場所をクリックかタップしてねミ☆';

            //音楽切り替え
            this.music.pause();
            this.music.src = MUSIC_BATTLE_START;
            this.music.play();

            //SE再生
            this.sound_effect.src = SE_SELECT;
            this.sound_effect.play();
        }
    }

    ///////////////////////////////////////////////////////////
    //	Method      : judgeGame
    //	Summary     : 勝利判定
    //	Arguments   : judge 判定する対象
    //              : MARU:0, BATSU:1
    //	Return      : 
    //	Note        : 勝者が決まったらthis.winnerに○or☓を代入
    ///////////////////////////////////////////////////////////
    judgeGame(judge)
    {
        let winner = INIT;
        //横の勝利判定
        //上
        if( this.field[TOP_LEFT] === judge && 
            this.field[TOP_CENTER] === judge &&
            this.field[TOP_RIGHT] === judge )
        {
            this.winner = judge;
        }
        //中
        else if(this.field[MIDDLE_LEFT] === judge && 
                this.field[MIDDLE_CENTER] === judge &&
                this.field[MIDDLE_RIGHT] === judge )
        {
            this.winner = judge;
        }
        //下
        else if(this.field[BOTTOM_LEFT] === judge && 
                this.field[BOTTOM_CENTER] === judge &&
                this.field[BOTTOM_RIGHT] === judge )
        {
            this.winner = judge;
        }
        //縦の勝利判定
        //左
        else if(this.field[TOP_LEFT] === judge && 
                this.field[MIDDLE_LEFT] === judge &&
                this.field[BOTTOM_LEFT] === judge )
        {
            this.winner = judge;
        }
        //中
        else if(this.field[TOP_CENTER] === judge && 
                this.field[MIDDLE_CENTER] === judge &&
                this.field[BOTTOM_CENTER] === judge )
        {
            this.winner = judge;
        }
        //右
        else if(this.field[TOP_RIGHT] === judge && 
                this.field[MIDDLE_RIGHT] === judge &&
                this.field[BOTTOM_RIGHT] === judge )
        {
            this.winner = judge;
        }
        //斜めの勝利判定
        //左上から右下
        else if(this.field[TOP_LEFT] === judge && 
                this.field[MIDDLE_CENTER] === judge &&
                this.field[BOTTOM_RIGHT] === judge )
        {
            this.winner = judge;
        }
        //左下から右上
        else if(this.field[BOTTOM_LEFT] === judge && 
                this.field[MIDDLE_CENTER] === judge &&
                this.field[TOP_RIGHT] === judge )
        {
            this.winner = judge;
        }
    }

    ///////////////////////////////////////////////////////////
    //	Method      : displayMarubatsu
    //	Summary     : 隠していた○☓を表示させる
    //	Arguments   : field_pos
    //              : 
    //	Return      : 
    //	Note        : 
    ///////////////////////////////////////////////////////////
    displayMarubatsu(field_pos)
    {
        let pos_x = INIT;
        let pos_z = INIT;
        let pos_y = INIT;
        switch(field_pos)
        {
            case TOP_LEFT:
                pos_x = -1 * FIELD_DISTANCE;
                pos_z = -1 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case TOP_CENTER:
                pos_x = 0;
                pos_z = -1 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case TOP_RIGHT:
                pos_x = FIELD_DISTANCE;
                pos_z = -1 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case MIDDLE_LEFT:
                pos_x = -1 * FIELD_DISTANCE;
                pos_z = 0;
                pos_y = 80;
                break;
            case MIDDLE_CENTER:
                pos_x = 0;
                pos_z = 0;
                pos_y = 80;
                break;
            case MIDDLE_RIGHT:
                pos_x = FIELD_DISTANCE;
                pos_z = 0;
                pos_y = 80;
                break;
            case BOTTOM_LEFT:
                pos_x = -1 * FIELD_DISTANCE;
                pos_z = FIELD_DISTANCE;
                pos_y = 80;
                break;
            case BOTTOM_CENTER:
                pos_x = 0;
                pos_z = FIELD_DISTANCE;
                pos_y = 80;
                break;
            case BOTTOM_RIGHT:
                pos_x = FIELD_DISTANCE;
                pos_z = FIELD_DISTANCE;
                pos_y = 80;
                break;
        }

        //ターン数から○か☓を移動するものを決定
        let current_model = INIT;
        let maru = false;
        switch(this.current_state)
        {
            //○
            case STATE_TURN_1:
                current_model = MODEL_MARU_0;
                maru = true;
                break;
            case STATE_TURN_3:
                current_model = MODEL_MARU_2;
                maru = true;
                break;
            case STATE_TURN_5:
                current_model = MODEL_MARU_4;
                maru = true;
                break;
            case STATE_TURN_7:
                current_model = MODEL_MARU_6;
                maru = true;
                break;
            case STATE_TURN_9:
                current_model = MODEL_MARU_8;
                maru = true;
                break;
            //☓
            case STATE_TURN_2:
                current_model = MODEL_BATSU_1;
                break;
            case STATE_TURN_4:
                current_model = MODEL_BATSU_3;
                break;
            case STATE_TURN_6:
                current_model = MODEL_BATSU_5;
                break;
            case STATE_TURN_8:
                current_model = MODEL_BATSU_7;
                break;
        }

        if(maru)
        {
            //○を移動
            this.model_maru[current_model].position.x = pos_x;
            this.model_maru[current_model].position.z = pos_z;
            this.model_maru[current_model].position.y = pos_y;
        }
        else
        {
            //☓を移動
            this.model_batu1[current_model].position.x = pos_x;
            this.model_batu1[current_model].position.z = pos_z;
            this.model_batu1[current_model].position.y = pos_y;
            this.model_batu2[current_model].position.x = pos_x;
            this.model_batu2[current_model].position.z = pos_z;
            this.model_batu2[current_model].position.y = pos_y;
        }
    }

    ///////////////////////////////////////////////////////////
    //	Method      : moveEvent
    //	Summary     : マウスを動かしたときに呼び出す関数
    //	Arguments   : 
    //              : 
    //	Return      : 
    //	Note        : マウス位置に点光源を移動したり、フィールドを明るくしたり
    ///////////////////////////////////////////////////////////
    moveEvent()
    {
        //マウス座標と点光源をシンクロさせる
		let pointX = -300 + event.offsetX;
		let pointY = -300 + event.offsetY;
        this.point_light_mouse.position.x = pointX;
		this.point_light_mouse.position.z = pointY;

        //クリックした場所を特定
        let field_pos = ILLEGAL;
        field_pos = this.fieldPosition();

        //○か☓があるならフィールド強調表示はしない
        //
        if( this.field[field_pos] === MARU ||
            this.field[field_pos] === BATSU||
            this.current_state === STATE_RESULT)
        {
            return;
        }

        //現在のマウスの位置を特定
        //マップ強調表示途中まで
        let pos_x, pos_y, pos_z;
        switch(field_pos)
        {
            case TOP_LEFT:
                pos_x = -1.13 * FIELD_DISTANCE;
                pos_z = -1.13 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case TOP_CENTER:
                pos_x = 0;
                pos_z = -1.13 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case TOP_RIGHT:
                pos_x = 1.13 * FIELD_DISTANCE;
                pos_z = -1.13 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case MIDDLE_LEFT:
                pos_x = -1.13 * FIELD_DISTANCE;
                pos_z = 0;
                pos_y = 80;
                break;
            case MIDDLE_CENTER:
                pos_x = 0;
                pos_z = 0;
                pos_y = 80;
                break;
            case MIDDLE_RIGHT:
                pos_x = 1.13 * FIELD_DISTANCE;
                pos_z = 0;
                pos_y = 80;
                break;
            case BOTTOM_LEFT:
                pos_x = -1.13 * FIELD_DISTANCE;
                pos_z = 1.13 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case BOTTOM_CENTER:
                pos_x = 0;
                pos_z = 1.13 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case BOTTOM_RIGHT:
                pos_x = 1.13 * FIELD_DISTANCE;
                pos_z = 1.13 * FIELD_DISTANCE;
                pos_y = 80;
                break;
            case ILLEGAL:
            default:
                return;
        }        
        this.point_light_select_field.position.x = pos_x;
        //this.point_light_select_field.position.y = ;
        this.point_light_select_field.position.z = pos_z;

        //デバッグモード
        if(DEBUG_MODE)
        {
            //console.log('move');
            //console.log(event.offsetX, event.offsetY);
            //console.log('--------');  
        }
    }

    ///////////////////////////////////////////////////////////
    //	Method      : draw3D_Init
    //	Summary     : 3D表示の初期処理
    //	Arguments   : int iwidth  ウィンドウサイズの幅
    //              : int iheight ウィンドウサイズの高さ
    //	Return      : 
    //	Note        : コンストラクタで実行
    ///////////////////////////////////////////////////////////
    draw3D_Init(iwidth, iheight)
    {
        const width = WINDOW_WIDTH;
        const height = WINDOW_HEIGHT;
        let rot = 0;

        //レンダラーの作成と設定
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas_object});

        this.renderer.setSize(iwidth, iheight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        //レンダラー：シャドウを有効にする
        this.renderer.shadowMap.enabled = true;

        //シーンを作成
        this.scene = new THREE.Scene();

        //画面が暗くなりすぎるのでやめた
        //フォグを設定
        // new THREE.Fog(色, 開始距離, 終点距離);
        //this.scene.fog = new THREE.Fog(0x4444ff, 0, 500);

        //カメラを作成
        this.camera = new THREE.PerspectiveCamera(45, iwidth / iheight, 1, 2000);  

        //カメラの初期座標を設定（X座標:0, Y座標:600, Z座標:0）
        this.camera.position.set(0, 600, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        // カメラコントローラーを作成
        this.controls = new THREE.OrbitControls(this.camera, document.getElementById('draw3D'));

        // 滑らかにカメラコントローラーを制御する
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.2;

        //版（床と線）を作成
        //※版に対して操作指示はしないのでオブジェクトとしては持たない
        //床を作成
        const meshFloor = new THREE.Mesh
        (
            new THREE.BoxGeometry(2000, 1, 2000),
            new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.0 })
        );
        meshFloor.receiveShadow = true;
        meshFloor.castShadow  = true;
        this.scene.add(meshFloor);

        //線を引く
        const geometry_x = new THREE.BoxGeometry(600, 100, 2);
        const geometry_z = new THREE.BoxGeometry(2, 100, 600);
        const material = new THREE.MeshPhongMaterial({color: 0xcccccc});
        const line1 = new THREE.Mesh(geometry_x, material);
        line1.receiveShadow = true;
        line1.castShadow  = true;
        line1.position.z = LINE_3D_Z;
        this.scene.add(line1);

        const line2 = new THREE.Mesh(geometry_x, material);
        line2.position.z = -1 * LINE_3D_Z;
        this.scene.add(line2);

        const line3 = new THREE.Mesh(geometry_z, material);
        line3.position.x = -1 * LINE_3D_X;
        this.scene.add(line3);

        const line4 = new THREE.Mesh(geometry_z, material);
        line4.position.x = LINE_3D_X;
        this.scene.add(line4);

        //平行光源
        //※平行光源に対して操作指示はしないのでオブジェクトとしては持たない
        const parallellight = new THREE.DirectionalLight(0xa0a0a0);
        parallellight.intensity = 1; // 光の強さを倍に
        parallellight.receiveShadow = true;
        parallellight.position.set(1, 5, 3); // ライトの方向
        // シーンに追加
        this.scene.add(parallellight);

        //点光源を作成
        //new THREE.PointLight(色, 光の強さ, 距離, 光の減衰率)
        this.point_light_red = new THREE.PointLight(0xcc4444, 4, 50, 2.0);
        //影を有効にする
        this.point_light_red.receiveShadow = true;
        this.point_light_red.castShadow = true;
        this.scene.add(this.point_light_red);

        // 照明を可視化するヘルパー
        const point_light_red_helper = new THREE.PointLightHelper(this.point_light_red);
        this.scene.add(point_light_red_helper);

        //new THREE.PointLight(色, 光の強さ, 距離, 光の減衰率)
        this.point_light_green = new THREE.PointLight(0x44cc44, 4, 50, 2.0);
        //影を有効にする
        this.point_light_green.receiveShadow = true;
        this.point_light_green.castShadow = true;
        this.scene.add(this.point_light_green);

        //照明を可視化するヘルパー
        const point_light_green_helper = new THREE.PointLightHelper(this.point_light_green);
        this.scene.add(point_light_green_helper);

        //点光源、マウスを追っていく
		//new THREE.PointLight(色, 光の強さ, 距離, 光の減衰率)
		this.point_light_mouse = new THREE.PointLight(0xaaaaaa, 4, 80, 2.0);
		//影を有効にする
		this.point_light_mouse.receiveShadow = true;
		this.point_light_mouse.castShadow = true;
		this.scene.add(this.point_light_mouse);

        //点光源、マウスがあるフィールドで、かつ選択可能なら光らせておく
		//new THREE.PointLight(色, 光の強さ, 距離, 光の減衰率)
		this.point_light_select_field = new THREE.PointLight(0xff8800, 4, 150, 2.0);
		//影を有効にする
		this.point_light_select_field.receiveShadow = true;
		this.point_light_select_field.castShadow = true;
		this.scene.add(this.point_light_select_field);

        //照明を可視化するヘルパー
        const point_light_select_field_helper = new THREE.PointLightHelper(this.point_light_select_field);
        this.scene.add(point_light_select_field_helper);

        //マルモデルを5個作成（画面外に隠しておく）
		const geometry_maru = new THREE.TorusGeometry( 45, 5, 16, 32 );
		const material_maru = new THREE.MeshStandardMaterial({ color: 0xbb0000, roughness: 0.0 });
        for(let imaru = MODEL_MARU_0; imaru <= MODEL_MARU_8; imaru++)
        {
            this.model_maru[imaru] = new THREE.Mesh( geometry_maru, material_maru );
            this.model_maru[imaru].receiveShadow = true;
            this.model_maru[imaru].castShadow  = true;
            this.model_maru[imaru].position.x = 1200;
            this.model_maru[imaru].position.y = -200;
            this.model_maru[imaru].position.z = 1200;
            this.scene.add( this.model_maru[imaru] );    
        }

        //バツモデルを4個作成（画面外に隠しておく）
		const geometry_batsu1 = new THREE.BoxGeometry(110, 5, 5);
		const material_batsu = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.0 });
		const geometry_batsu2 = new THREE.BoxGeometry(5, 5, 110);
        for(let ibatu = MODEL_BATSU_1; ibatu <= MODEL_BATSU_7; ibatu++)
        {
            this.model_batu1[ibatu] = new THREE.Mesh( geometry_batsu1, material_batsu );
            this.model_batu1[ibatu].receiveShadow = true;
            this.model_batu1[ibatu].castShadow  = true;
            this.model_batu1[ibatu].position.x = 1200;
            this.model_batu1[ibatu].position.y = -200;
            this.model_batu1[ibatu].position.z = 1200;
            this.scene.add( this.model_batu1[ibatu] );
    
            this.model_batu2[ibatu] = new THREE.Mesh( geometry_batsu2, material_batsu );
            this.model_batu2[ibatu].receiveShadow = true;
            this.model_batu2[ibatu].castShadow  = true;
            this.model_batu2[ibatu].position.x = 1200;
            this.model_batu2[ibatu].position.y = -200;
            this.model_batu2[ibatu].position.z = 1200;
            this.scene.add( this.model_batu2[ibatu] );    
        }

		//アニメーションループ設定
		//生成したインスタンスのみで動作させたいのでバインド
		this.renderer.setAnimationLoop(this.loopAnimation.bind(this));

        // レンダリング
        this.renderer.render(this.scene, this.camera); 
    }

    ///////////////////////////////////////////////////////////
    //	Method      : loopAnimation
    //	Summary     : 画面内で物体をアニメーションする
    //	Arguments   : 
    //              : 
    //	Return      : 
    //	Note        : setAnimationLoopで呼び出す関数
    ///////////////////////////////////////////////////////////
    loopAnimation()
    {
		// 点光源の位置を更新
		const t = Date.now() / 2000;
		const r = 220.0;
		const lx = r * Math.cos(t);
		const lz = r * Math.sin(t);
		const ly = 30.0 + 5.0 * Math.sin(t / 3.0);
		this.point_light_red.position.set(lx, ly, lz);
		this.point_light_red.lookAt(new THREE.Vector3(0, 0, 0));
		this.point_light_green.position.set(-lx, ly, -lz);
		this.point_light_green.lookAt(new THREE.Vector3(0, 0, 0));

		//点光源・マウスを追っていく光のY軸を微妙に動かす
		const light_mouse_y = 30 +  28 * Math.sin(t / 1.0);
		this.point_light_mouse.position.y = light_mouse_y;

		//選択したフィールドの光のY軸を調整
		const select_field_y = 20 +  19 * Math.sin(t / 0.2);
		this.point_light_select_field.position.y = select_field_y;

		//マル回転
        for(let imaru = MODEL_MARU_0; imaru <= MODEL_MARU_8; imaru++)
        {
            if(this.winner === MARU)
            {
                //勝ったときは高速回転する
                this.model_maru[imaru].rotation.x += 0.1;
                this.model_maru[imaru].rotation.y += 0.1;
                this.model_maru[imaru].rotation.z += 0.1;
            }
            else if(this.winner === BATSU)
            {
                //画面外に消える
                this.model_maru[imaru].position.y += ly;
            }
            else
            {
                this.model_maru[imaru].rotation.x += 0.01;
                this.model_maru[imaru].rotation.y += 0.04;
                this.model_maru[imaru].rotation.z += 0.03;
            }
        }

		//バツ回転
        for(let ibatu = MODEL_BATSU_1; ibatu <= MODEL_BATSU_7; ibatu++)
        {
            if(this.winner === BATSU)
            {
                //勝ったときは高速回転する
                this.model_batu1[ibatu].rotation.x -= 0.1;
                this.model_batu1[ibatu].rotation.y -= 0.1;
                this.model_batu1[ibatu].rotation.z -= 0.1;
                this.model_batu2[ibatu].rotation.x -= 0.1;
                this.model_batu2[ibatu].rotation.y -= 0.1;
                this.model_batu2[ibatu].rotation.z -= 0.1;    
            }
            else if(this.winner === MARU)
            {
                //画面外に消える
                this.model_batu1[ibatu].position.y += ly;
                this.model_batu2[ibatu].position.y += ly;
            }
            else
            {
                this.model_batu1[ibatu].rotation.x -= 0.03;
                this.model_batu1[ibatu].rotation.y -= 0.03;
                this.model_batu1[ibatu].rotation.z -= 0.03;
                this.model_batu2[ibatu].rotation.x -= 0.03;
                this.model_batu2[ibatu].rotation.y -= 0.03;
                this.model_batu2[ibatu].rotation.z -= 0.03;    
            }
        }

        // 原点方向を見つめる
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        // レンダリング
        this.renderer.render(this.scene, this.camera); 
    }

    ///////////////////////////////////////////////////////////
    //	Method      : order
    //	Summary     : 先行・後攻を決める
    //	Arguments   : 
    //              : 
    //	Return      : 
    //	Note        : 未実装
    ///////////////////////////////////////////////////////////
    order()
    {        
        //デバッグモード
        if(DEBUG_MODE)
        {
        }
    }

    ///////////////////////////////////////////////////////////
    //	Method      : createTextPng
    //	Summary     : テキストをpngに変換
    //	Arguments   : 
    //              : 
    //	Return      : 
    //	Note        : 未使用
    ///////////////////////////////////////////////////////////
    createTextPng(text,size,color)
    {
        let can=document.createElement("canvas");
        let ctx=can.getContext("2d");
        let family = [];
        family=
          'Verdana,Roboto,"Droid Sans","游ゴシック",YuGothic,"メイリオ",Meiryo,'+
          '"ヒラギノ角ゴ ProN W3","Hiragino Kaku Gothic ProN","ＭＳ Ｐゴシック",sans-serif';
        ctx.font=size+" "+family;
        ctx.baseLine="top";
        ctx.textAlign="left";
        let measure=ctx.measureText(text);
        can.width=measure.width;
        can.height=measure.fontBoundingBoxAscent+measure.fontBoundingBoxDescent;
        //幅高さを変更すると再設定が必要になる
        ctx.font=size+" "+family;
        ctx.baseLine="top";
        ctx.textAlign="left";
        //透明にする
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle="rgb(255,255,255)";
        ctx.fillRect(0,0,can.width,can.height);
        //通常描画にする
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle=color;
        ctx.fillText(text,Math.abs(measure.actualBoundingBoxLeft),measure.actualBoundingBoxAscent);
        let png=can.toDataURL('image/png');
        return {img:png, w:can.width, h:can.height};
    }
}
