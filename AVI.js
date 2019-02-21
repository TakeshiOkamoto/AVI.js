/**************************************************/
/*                                                */
/*     AVI.js                                     */
/*                                      v1.00     */
/*                                                */
/*     Copyright 2019 Takeshi Okamoto (Japan)     */
/*                                                */
/*     Released under the MIT license             */
/*     https://github.com/TakeshiOkamoto/         */
/*                                                */
/*                            Date: 2019-02-20    */
/**************************************************/

////////////////////////////////////////////////////////////////////////////////
// Generic Functions
////////////////////////////////////////////////////////////////////////////////

function Byte2Word(PByteArray){    
  return (PByteArray[1] << 8 | PByteArray[0]);
}

function Byte2DWord(PByteArray){  
  return (PByteArray[3] << 24 | PByteArray[2] << 16 | PByteArray[1] << 8 |  PByteArray[0]) ;
}

////////////////////////////////////////////////////////////////////////////////
// Generic Class
////////////////////////////////////////////////////////////////////////////////

// ---------------------
//  TReadStream            
// ---------------------
function TReadStream(AStream) {
  this.Pos = 0;
  this.Stream = AStream;
  this.FileSize = AStream.length;
}

// ---------------------
//  TReadStream.Method     
// ---------------------
TReadStream.prototype = {

  Read: function (ReadByteCount) {
    var P = this.Stream.subarray(this.Pos, this.Pos + ReadByteCount);
    this.Pos = this.Pos + ReadByteCount;
    return P;
  },

  ReadString: function (ReadByteCount) {
    var P = String.fromCharCode.apply(
             null, this.Stream.subarray(this.Pos, this.Pos + ReadByteCount));
    this.Pos = this.Pos + ReadByteCount;
    return P;
  }
}

// ---------------------
//  TFileStream            
// ---------------------
function TFileStream(BufferSize) {

  if (BufferSize == undefined)
    this.MemorySize = 50000000; // 50M
  else
    this.MemorySize = parseInt(BufferSize, 10);

  this.Size = 0;
  this.Stream = new Uint8Array(this.MemorySize);
}

// ---------------------
//  TFileStream.Method     
// ---------------------
TFileStream.prototype = {

  _AsciiToUint8Array: function (S) {
    var len = S.length;
    var P = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      P[i] = S[i].charCodeAt(0);
    }
    return P;
  },

  WriteByte: function (value) {
    var P = new Uint8Array(1);
    
    P[0] = value;
    
    this.WriteStream(P);      
  },
    
  WriteWord: function (value) {
    var P = new Uint8Array(2);
    
    P[1] = (value & 0xFF00) >> 8;
    P[0] = (value & 0x00FF);  
    
    this.WriteStream(P);      
  },

  WriteDWord: function (value) {
    var P = new Uint8Array(4);
    
    P[3] = (value & 0xFF000000) >> 24;
    P[2] = (value & 0x00FF0000) >> 16;
    P[1] = (value & 0x0000FF00) >> 8;
    P[0] = (value & 0x000000FF);  
    
    this.WriteStream(P);      
  },
    
  WriteWord_Big: function (value) {
    var P = new Uint8Array(2);
    
    P[1] = (value & 0x00FF);
    P[0] = (value & 0xFF00) >> 8;  
    
    this.WriteStream(P);      
  },        
  
  WriteDWord_Big: function (value) {
    var P = new Uint8Array(4);
    
    P[3] = (value & 0x000000FF) 
    P[2] = (value & 0x0000FF00) >> 8;
    P[1] = (value & 0x00FF0000) >> 16;
    P[0] = (value & 0xFF000000) >> 24;;  
    
    this.WriteStream(P);      
  },
      
  WriteString: function (S) {
    var P = this._AsciiToUint8Array(S);

    // メモリの再編成
    if (this.Stream.length <= (this.Size + P.length)) {
      var B = new Uint8Array(this.Stream);
      this.Stream = new Uint8Array(this.Size + P.length + this.MemorySize);
      this.Stream.set(B.subarray(0, B.length));
    }

    this.Stream.set(P, this.Size);
    this.Size = this.Size + P.length;
  },

  WriteStream: function (AStream) {      
      
    // メモリの再編成
    if (this.Stream.length <= (this.Size + AStream.length)) {
      var B = new Uint8Array(this.Stream);
      this.Stream = new Uint8Array(this.Size + AStream.length + this.MemorySize);
      this.Stream.set(B.subarray(0, B.length));
    }

    this.Stream.set(AStream, this.Size);
    this.Size = this.Size + AStream.length;
  },

  getFileSize: function () {
    return this.Size;
  },

  SaveToFile: function (FileName,type) {
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(new Blob([this.Stream.subarray(0, this.Size)], { type: type }), FileName);
    } else {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([this.Stream.subarray(0, this.Size)], { type: type }));
      //a.target   = '_blank';
      a.download = FileName;
      document.body.appendChild(a); //  FF specification
      a.click();
      document.body.removeChild(a); //  FF specification
    }
  },
}

// ---------------------
//  TBMPWriter_min        
// ---------------------
// Full edition --> BMP.js (TBMPWriter)
// https://github.com/TakeshiOkamoto/ 
// Full edition is corresponds to 1/4/8/24 bit.
function TBMPWriter_min(imagedata) {
  this.raw    = imagedata.data;
  this.width  = imagedata.width;
  this.height = imagedata.height;  

  this.palette = null;
  this.color_depth = 24;  // only
}
  
TBMPWriter_min.prototype = {
        
  GetBitmapWidth: function(BitCount,Width){
    var result = 0;

    switch (BitCount){
      case 1  : result = Math.floor((Width + 7) / 8); break;
      case 4  : result = Math.floor((Width + 7) / 8) << 2; break;
      case 8  : result = Width; break;
      case 16 : result = Math.floor((Width * 16 + 31) / 32) * 4; break; 
      case 24 : result = Math.floor((Width * 24 + 31) / 32) * 4; break;
      case 32 : result = Math.floor((Width * 32 + 31) / 32) * 4; break;         
    }
    
    if (BitCount == 1 || BitCount == 4 || BitCount == 8){
      if ((result & 3) != 0)  result = (result | 3) + 1;
    }

    return result;
  },

  _WriteImageData: function (Stream,XorSize) {
    var p_cnt    = 0;
    var img_cnt  = 0;
    var line_cnt = 0;
    
    var width  = this.width;
    var height = this.height;
    var raw    = this.raw;
    var color_depth = this.color_depth;  

    var LineWidth = this.GetBitmapWidth(color_depth,width);
            
    P = new Uint8Array(XorSize);
    
    for (var j = 0; j < P.length; j++) { P[j] = 0; }
      
    for (var i = 0; i < height; i++) { 
      line_cnt =0;   
      for (var j = 0; j < width; j++) {
        P[p_cnt++] = raw[img_cnt+2];
        P[p_cnt++] = raw[img_cnt+1];
        P[p_cnt++] = raw[img_cnt];
        
        img_cnt += 4; line_cnt += 3;
      }

      while (true){
        if (line_cnt == LineWidth) break;
        p_cnt++;
        line_cnt++;
      } 
    }    
   
    var cnt = 0;
    var B = new Uint8Array(P.length);
    for (var i = height -1; i >=0 ; i--) {
      for (var j = 0; j < LineWidth; j++) {
        B[cnt++] = P[(LineWidth*i)+ j]; 
      }
    }
          
    Stream.WriteStream(B);      
  },
          
  SaveToStream: function () {
    var F = new TFileStream();

    var XorSize = Math.floor((this.color_depth * this.width + 31) / 32) * 4 * Math.abs(this.height);
    
    var PaletteSize = 0;
    if (this.color_depth != 24){
      PaletteSize = Math.pow(2,this.color_depth) *4;
    }
           
    // -------------------------
    //  BitmapFileHeader(14byte)
    // -------------------------
    
    // 0x424D(BM)
    F.WriteByte(0x42);
    F.WriteByte(0x4D);
    
    // ファイルサイズ
    F.WriteDWord(14 + 40 + PaletteSize + XorSize);
    // 予約1
    F.WriteWord(0);
    // 予約2
    F.WriteWord(0);
    // 画像データ(XOR)までのバイト数
    F.WriteDWord(14 + 40 + PaletteSize);

    // -------------------------
    //  BitmapInfoHeader(40byte)
    // -------------------------
        
    // 構造体のサイズ
    F.WriteDWord(40);        
    // 幅
    F.WriteDWord(this.width);        
    // 高さ
    F.WriteDWord(this.height);        
    // 常に1
    F.WriteWord(1);        
    // カラービット数(0,1,4,8,16,24,32)
    F.WriteWord(this.color_depth);        
    // 圧縮形式 非圧縮:0 
    F.WriteDWord(0);        
    // イメージのサイズ(Xor) 
    F.WriteDWord(XorSize);        
    // 水平解像度
    F.WriteDWord(0);        
    // 垂直解像度
    F.WriteDWord(0);        
    // 実際に使用されているカラーテーブルのエントリ数
    F.WriteDWord(0);
    // 重要なカラーテーブル数
    F.WriteDWord(0);

    // ----------------------
    //  Xor
    // ----------------------
    this._WriteImageData(F,XorSize);           
    
    return F;              
  },    
  
  SaveToFile: function (FileName) {
    var F = this.SaveToStream();
    F.SaveToFile(FileName,"image/bmp");   
  }       
}  

// ---------------------
//  TAVIWriter        
// ---------------------
function TAVIWriter(width,height,fps) {
  this.width  = width;
  this.height = height;
  this.fps  = fps;  
  this.bits = 24;
  
  this.Images = [];
  this.WaveFile = null;
}
  
TAVIWriter.prototype = {        

  addImage: function(data){
   if(data.length != (this.width * this.height * 4)){
     throw "The image size is incorrect.";
   }

   // Create bitmap file
   var bmp = new TBMPWriter_min({'width':this.width,'height':this.height,'data':data});
   var F = bmp.SaveToStream();   
   
   // ネイティブ配列を割り当てることでヒープサイズの制限を回避
   // ※new Uint8Arrayをしないと100MBぐらいでブラウザが落ちる
   this.Images.push(new Uint8Array(F.Stream.subarray(0, F.getFileSize())));
  },
    
  addWaveFile: function(PByteArray){
    var errormsg = "It is not a WAVE file.";
    var stream =  new TReadStream(PByteArray);
    
    // RIFF
    var magic = stream.ReadString(4); 
    if(magic != "RIFF"){
      throw errormsg;
    }
    stream.Read(4);
    
    // WAVE
    magic = stream.ReadString(4); 
    if(magic != "WAVE"){
      throw errormsg;
    }   

    // fmt
    var len, WaveFomat = {}, strf;  
    while(true){
      magic = stream.ReadString(4); 
      if(magic == "fmt "){
        len = Byte2DWord(stream.Read(4));      
        
        // WaveFomatのバイト配列
        strf = stream.Stream.subarray(stream.Pos, stream.Pos + 16);
          
        // 種類(1:リニアPCM)
        WaveFomat.wFormatTag = Byte2Word(stream.Read(2)); 
        // チャンネル数(1:モノラル 2:ステレオ)     
        WaveFomat.nChannels = Byte2Word(stream.Read(2));
        // サンプリングレート(44100=44.1kHzなど)      
        WaveFomat.nSamplesPerSec = Byte2DWord(stream.Read(4));  
        // 平均データ転送レート(byte/sec) 
        // ※PCMの場合はnSamplesPerSec * nBlockAlign          
        WaveFomat.nAvgBytesPerSec = Byte2DWord(stream.Read(4));  
        // ブロックサイズ 
        // ※PCMの場合はwBitsPerSample * nChannels / 8 
        WaveFomat.nBlockAlign = Byte2Word(stream.Read(2)); 
        // サンプルあたりのビット数 (bit/sample) 
        // ※PCMの場合は8bit=8, 16bit =16    
        WaveFomat.wBitsPerSample = Byte2Word(stream.Read(2)); 
        
        // WaveFomatEx対策
        stream.Pos = stream.Pos + len - 16;
        break;
      }else{
        len = Byte2DWord(stream.Read(4));
        stream.Pos += len;
      }  
    
      if (stream.Pos >= stream.FileSize){
        throw errormsg;
      }
    }

    // data
    var raw;
    while(true){
      magic = stream.ReadString(4); 
      if(magic == "data"){
        len = Byte2DWord(stream.Read(4));
        raw = stream.Stream.subarray(stream.Pos,stream.Pos + len);
        
        break;
      }else{
        var len = Byte2DWord(stream.Read(4));
        stream.Pos += len;
      }  
      
      if (stream.Pos >= stream.FileSize){
        throw errormsg;
      }
    }

    this.WaveFile =
            { 'WaveFomat':WaveFomat,   // WaveFomat構造体(アクセス用)
              'strf': strf,            // WaveFomat構造体(バイト配列)
              'raw' : raw,             // 波形データ
              'time': 1000 * len / WaveFomat.nAvgBytesPerSec // 再生時間(ミリ秒)
            } 
  },
      
  SaveToStream: function(){
  
    if(this.Images.length == 0 && (!this.WaveFile)){
      throw "Please add image or sound data.";      
    }

    var F = new TFileStream();

    // 'RIFF'
    F.WriteString('RIFF');
    // サイズ「ファイル全体 - 8byte」(RIFFとサイズの8byteを除く)
    F.WriteDWord(0);      
    
    // 'AVI '
    F.WriteString('AVI ');
    
    // **********************************
    //  各ヘッダの定義 
    // **********************************
    // 'LIST' 
    F.WriteString('LIST');   
       
    // サイズ  
    if(this.Images.length != 0 && (!this.WaveFile)){
      // ヘッダ + ビデオ 
      F.WriteDWord(68 +(116+8));
    }
    if(this.Images.length == 0 && (this.WaveFile)){
      // ヘッダ + オーディオ
      F.WriteDWord(68 + (92+8));
    }
    if(this.Images.length != 0 && (this.WaveFile)){
      // ヘッダ + ビデオ + オーディオ
      F.WriteDWord(68 +(116+8)+(92+8));
    }

    // 'hdrl'
    F.WriteString('hdrl');          
    
    // ----------------- 
    //  ヘッダ        
    // -----------------                  
    // --- メインヘッダ構造体(48byte)
    
    // 'avih'
    F.WriteString('avih');
    // 構造体のサイズ
    F.WriteDWord(56);
    // フレーム間の間隔(マイクロ秒単位) 
    F.WriteDWord(1/this.fps*1000*1000);
    
    // 最大データレート(毎秒のバイト数) 
    if(this.Images.length != 0 && (!this.WaveFile)){
      // 画像のみ      
      F.WriteDWord(this.width * this.height * (this.bits/8) * this.fps);
    }
    if(this.Images.length == 0 && (this.WaveFile)){
      // 音声のみ      
      F.WriteDWord(this.WaveFile.WaveFomat.nAvgBytesPerSec);
    } 
    if(this.Images.length != 0 && (this.WaveFile)){
      // 画像 + 音声      
      F.WriteDWord((this.width * this.height * (this.bits/8) * this.fps) + this.WaveFile.WaveFomat.nAvgBytesPerSec);  
    }   
    
    // パディング設定        
    F.WriteDWord(0);    
        
    // フラグ
    // AVIF_HASINDEX = 16  ファイルにインデックスがある    
    // AVIF_TRUSTCKTYPE = 2048 インデックス内のキーフレームフラグが信頼できる
    F.WriteDWord(2064);
    // フレームの総数(画像枚数)
    F.WriteDWord(this.Images.length);
    // ファイルの開始フレーム(インターリーブ以外は0)        
    F.WriteDWord(0);
    
    // ファイル内のストリーム数(オーディオとビデオを含む時は2)    
    if(this.Images.length != 0 && (this.WaveFile)){
      F.WriteDWord(2);
    }else{
      F.WriteDWord(1);      
    }    
    
    // ファイルの読み取り用のバッファサイズ
    if(this.WaveFile){
       F.WriteDWord(this.WaveFile.raw.length);    
    }else{
       F.WriteDWord(this.width * this.height * (this.bits/8));    
    }   
    // 横幅
    F.WriteDWord(this.width);   
    // 縦幅
    F.WriteDWord(this.height);
      
    // 予約(16byte)
    F.WriteDWord(0);   
    F.WriteDWord(0);   
    F.WriteDWord(0);   
    F.WriteDWord(0);   
     
    // ----------------- 
    //  ビデオ        
    // -----------------
    if(this.Images.length != 0){   
               
      // 'LIST' 
      F.WriteString('LIST');      
      // サイズ
      F.WriteDWord(116);        
      // 'strl'
      F.WriteString('strl');                

      // --- ストリームヘッダ構造体(56byte)    
              
      // 'strh'
      F.WriteString('strh');
      // 構造体のサイズ
      F.WriteDWord(56);
      // データタイプ(ビデオはvids オーディオはauds)
      F.WriteString('vids');
      // コーデック(DIB)
      F.WriteString('DIB ');
      // ストリームフラグ(0)
      F.WriteDWord(0);  
      // 優先順位(0)
      F.WriteWord(0);  
      // 言語(0)
      F.WriteWord(0);  
      // dwInitialFrames
      F.WriteDWord(0);  
      // fpsの設定
      // ※1秒あたりのサンプル数 = dwRate  / dwScale
      // ※dwScale = 1000 dwRate = 2000 だと1秒に2枚の画像
      // dwScale
      F.WriteDWord(1000);
      // dwRate
      F.WriteDWord(1000 * this.fps); 
      // ストリームの開始タイム(0)
      F.WriteDWord(0); 
      // ストリームの長さ(画像枚数) 
      F.WriteDWord(this.Images.length);  
      // ファイルの読み取り用のバッファサイズ        
      F.WriteDWord(this.width * this.height * (this.bits/8));
      // 品質(0)
      F.WriteDWord(0);  
      // サンプルサイズ(0)
      F.WriteDWord(0);  
      
      // left
      F.WriteWord(0);  
      // top
      F.WriteWord(0);  
      // right
      F.WriteWord(this.width);  
      // bottom
      F.WriteWord(this.height);  
      
      // 'strf'
      F.WriteString('strf');
      // サイズ
      F.WriteDWord(40);
      // BitmapInfoHeader(40btye)
      F.WriteStream(this.Images[0].subarray(14,14 + 40));   
    }
    
    // ----------------- 
    //  オーディオ        
    // -----------------   
    if(this.WaveFile){    
           
      // 'LIST' 
      F.WriteString('LIST');      
      // サイズ
      F.WriteDWord(92);        
      // 'strl'
      F.WriteString('strl');    
      
      // --- ストリームヘッダ構造体(56byte)    
              
      // 'strh'
      F.WriteString('strh');
      // 構造体のサイズ
      F.WriteDWord(56);
      // データタイプ(ビデオはvids オーディオはauds)
      F.WriteString('auds');
      // コーデック(無圧縮)
      F.WriteDWord(0);
      // ストリームフラグ(0)
      F.WriteDWord(0);  
      // 優先順位(0)
      F.WriteWord(0);  
      // 言語(0)
      F.WriteWord(0);  
      // dwInitialFrames
      F.WriteDWord(0);  
      // dwScale
      F.WriteDWord(this.WaveFile.WaveFomat.nBlockAlign);  
      // dwRate
      F.WriteDWord(this.WaveFile.WaveFomat.nAvgBytesPerSec);          
      // ストリームの開始タイム(0)
      F.WriteDWord(0); 
      // ストリームの長さ 
      F.WriteDWord(this.WaveFile.raw.length / this.WaveFile.WaveFomat.nBlockAlign);
      // ファイルの読み取り用のバッファサイズ        
      F.WriteDWord(this.WaveFile.raw.length);  
      // 品質(0)
      F.WriteDWord(0);  
      // サンプルサイズ
      F.WriteDWord(this.WaveFile.WaveFomat.nBlockAlign); 
      
      // left
      F.WriteWord(0);  
      // top
      F.WriteWord(0);  
      // right
      F.WriteWord(0);  
      // bottom
      F.WriteWord(0);  
      
      // 'strf'
      F.WriteString('strf');
      // サイズ
      F.WriteDWord(16);
      // WaveFomat(16btye)
      F.WriteStream(this.WaveFile.strf); 
    }
    
    // **********************************
    //   ストリームデータ(生データ)
    // **********************************
           
    // 'LIST' 
    F.WriteString('LIST');      

    // サイズ
    var size = 4;
    
    // 画像サイズ
    if(this.Images.length != 0){
      size = size + 8 * (this.Images.length); 
      size = size + ((this.Images[0].length - (14 +40)) * this.Images.length);
    }
    
    // 音声サイズ    
    if(this.WaveFile){
      size = size + 8 * 1; 
      size = size + this.WaveFile.raw.length
    }
    F.WriteDWord(size);
     
    // movi
    var plist_i = [];
    var movi_pos = F.Size;           
    F.WriteString('movi'); 
    
    // 画像データ
    for(var i=0;i<this.Images.length;i++){
      plist_i.push(F.Size - movi_pos);    
      F.WriteString('00'); 
      F.WriteString('db'); 
      F.WriteDWord(this.Images[0].length - (14 +40));
      F.WriteStream(this.Images[i].subarray(54,this.Images[i].length));
    }       
    
    // 音声データ
    var plist_w = F.Size - movi_pos;    
    if(this.WaveFile){
      // 音声のみ
      if(this.Images.length == 0){
        F.WriteString('00'); 
      }else{ 
        F.WriteString('01'); 
      }
      F.WriteString('wb'); 
      F.WriteDWord(this.WaveFile.raw.length);
      F.WriteStream(this.WaveFile.raw);      
    }

    // **********************************
    //   インデックス
    // **********************************
  
    // 'idx1'
    F.WriteString('idx1'); 
    var count = this.Images.length;
    if(this.WaveFile){
      count++;
    }
    F.WriteDWord(16 * count);
    
    // 画像
    for(var i=0;i<this.Images.length;i++){
      F.WriteString('00'); 
      F.WriteString('db'); 
      // AVIIF_KEYFRAME =16
      F.WriteDWord(16); 
      // オフセット
      F.WriteDWord(plist_i[i]);
      // サイズ
      F.WriteDWord(this.Images[0].length - (14 +40));
    } 
    
    // 音声
    if(this.WaveFile){
      // 音声のみ
      if(this.Images.length == 0){
        F.WriteString('00'); 
      }else{ 
        F.WriteString('01'); 
      }
      F.WriteString('wb'); 
      F.WriteDWord(16);
      F.WriteDWord(plist_w);
      F.WriteDWord(this.WaveFile.raw.length);      
    }
    
    // 最後にファイルサイズ
    var size = F.Size -8; 
    F.Stream[7] = (size & 0xFF000000) >> 24;
    F.Stream[6] = (size & 0x00FF0000) >> 16;
    F.Stream[5] = (size & 0x0000FF00) >> 8;
    F.Stream[4] = (size & 0x000000FF);  
    
    return F;
    
    // This code is Uint8Array
    // return F.Stream.subarray(0, F.getFileSize());
  },
  
  // AVIファイルの生成     
  // FileName : ファイル名
  SaveToFile: function (FileName) {
    var F = this.SaveToStream();
  
    // ファイルをダウンロード             
    F.SaveToFile(FileName,"video/avi");   
  }              
}  
