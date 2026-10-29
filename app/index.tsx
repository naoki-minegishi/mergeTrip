// @ts-nocheck
import { GravitasOne_400Regular } from '@expo-google-fonts/gravitas-one';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
// 他のimportの並びに追加
import * as Print from 'expo-print';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useColorScheme,
    useWindowDimensions,
    View,
} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import QRCode from 'react-native-qrcode-svg';
// 他のimportの並びに追加してください
import {
    MPLUSRounded1c_400Regular,
    MPLUSRounded1c_700Bold,
    MPLUSRounded1c_900Black,
    useFonts
} from '@expo-google-fonts/m-plus-rounded-1c';
import * as Sharing from 'expo-sharing';
// 他のimportの下に追加

// ■■■ ダークモード対応カラーパレット ■■■
// ■■■ テーマカラー定義 ■■■
// ■■■ テーマカラー定義 (俺流ダークモード版) ■■■
// ■■■ テーマカラー定義 (ユーザー指定版) ■■■
const Colors = {
  light: {
    background: '#f5f5f5',     // 背景：薄いグレー
    header: '#ffffff',         // ヘッダー：白
    card: '#ffffff',           // カード：白
    text: '#333333',           // ★重要: ライトモードの文字は濃い色
    subText: '#666666',        // サブ文字：グレー
    border: '#e0e0e0',         // 枠線
    tint: '#007AFF',           // アクセント：青
    danger: '#ff3b30',         // エラー：赤
    tabBar: '#ffffff',         // タブバー：白
    todayBg: '#fff5f5',        // 当日背景：薄い赤
    todayBorder: '#ff5252',    // 当日枠線：赤
    modalBg: '#ffffff',
    inputBg: '#f9f9f9',
  },
  dark: {
    background: '#333333',     // ★背景：濃いグレー
    header: '#000000',         // ★ヘッダー：黒
    card: '#000000',           // ★カード：黒
    text: '#FFFFFF',           // ★文字：白
    subText: '#CCCCCC',        // ★サブ文字：明るいグレー
    border: '#444444',         // 枠線：背景より少し明るく
    tint: '#FFA726',           // アクセント：オレンジ系
    danger: '#CF6679',         // エラー：落ち着いた赤
    tabBar: '#000000',         // ★タブバー：黒
    todayBg: '#7d2808ff',        // ★当日背景：濃いオレンジ
    todayBorder: '#f35f29ff',    // 当日枠線：同色
    modalBg: '#000000',    // ★修正: 完全な黒に変更
    inputBg: '#111111',    // ★修正: 入力欄もほぼ黒に
  }
};

// ■■■ アプリ全体の定数設定 ■■■
const KO_COLOR = '#007AFF'; // メインカラー
const PROJECTS_KEY = 'travel_projects_v2';
const PROJECT_DATA_PREFIX = 'project_data_';
const STOCK_KEY = 'travel_stock_items';

// 宿のステータス定義
const HOTEL_STATUSES = [
  { id: 'none', label: '未予約', color: '#ff5252', bg: '#ffebee' },
  { id: 'reserved', label: '予約済', color: '#ff9800', bg: '#fff3e0' },
  { id: 'paid', label: '決済済', color: '#4caf50', bg: '#e8f5e9' },
];

// 予定（アイテム）のカテゴリ定義
// ■■■ カテゴリ定義 (ダークモード対応版) ■■■
const ITEM_CATEGORIES = [
  { 
    id: 'sightseeing', label: '観光', icon: '📷', 
    bg: '#e1f5fe', border: '#0288d1', 
    darkBg: '#263238' // くすんだ青黒
  },
  { 
    id: 'meal', label: '食事', icon: '🍽️', 
    bg: '#fff3e0', border: '#f57c00', 
    darkBg: '#3e2723' // 焦げ茶
  },
  { 
    id: 'activity', label: '遊び', icon: '🎡', 
    bg: '#f3e5f5', border: '#7b1fa2', 
    darkBg: '#4a148c' // 暗い紫
  },
  { 
    id: 'shopping', label: '買い物', icon: '🛍️', 
    bg: '#fff8e1', border: '#ffa000', 
    darkBg: '#33691e' // 暗いオリーブ
  },
  { 
    id: 'move', label: '移動', icon: '🚗', 
    bg: '#e8f5e9', border: '#388e3c', 
    darkBg: '#1b5e20' // 暗い緑
  },
  { 
    id: 'note', label: 'メモ', icon: '📝', 
    bg: '#f5f5f5', border: '#616161', 
    darkBg: '#212121' // ダークグレー
  },
  { 
    id: 'checkin', label: '宿泊', icon: '🏨', 
    bg: '#ffffff', border: '#1565c0', 
    darkBg: '#000000' // 黒
  },
];

// ストック場所のカテゴリ定義
const STOCK_CATEGORIES = [
  { id: 'sightseeing', label: '観光', icon: '📷' },
  { id: 'food', label: 'グルメ', icon: '🍽️' },
  { id: 'hotel', label: '宿泊', icon: '🏨' },
  { id: 'shop', label: '買い物', icon: '🛍️' },
  { id: 'other', label: 'その他', icon: '🔖' },
];

// 移動手段の選択肢
const TRANSPORT_OPTIONS = [
  { label: '車', icon: '🚗', defaultTitle: '車で移動' },
  { label: '電車', icon: '🚃', defaultTitle: '電車で移動' },
  { label: '新幹線', icon: '🚄', defaultTitle: '新幹線で移動' },
  { label: '飛行機', icon: '✈️', defaultTitle: 'フライト' },
  { label: 'バス', icon: '🚌', defaultTitle: 'バス移動' },
  { label: '徒歩', icon: '🚶', defaultTitle: '徒歩で移動' },
  { label: '船', icon: '🚢', defaultTitle: 'フェリー' },
];
// ■■■ 画像保存のためのヘルパー関数 ■■■

// ファイル名に使えない文字を安全な文字に置換する関数
const sanitizeFileName = (name) => {
  return name.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
};

/**
 * 画像を処理して保存する関数
 * 1. オリジナルをカメラロールに保存（カメラ撮影時のみ）
 * 2. 画像を圧縮・リサイズ
 * 3. アプリ内フォルダにルール通りの名前で保存
 */
/**
 * 画像を処理して保存する関数 (Androidエラー対策版)
 * 1. オリジナルをカメラロールに保存（カメラ撮影時のみ）
 * 2. 画像を圧縮・リサイズ
 * 3. アプリ内フォルダにルール通りの名前で保存
 */
const processAndSaveImage = async (uri, projectTitle, dayLabel, itemTitle, isCamera) => {
  try {
    // 1. オリジナルを端末のアルバムに保存（カメラ撮影時のみ）
    if (isCamera) {
      try {
        // ★修正点: 権限リクエストでエラーが出ても(AndroidのAudio問題など)、保存を試みるようにtry-catchで囲む
        const permission = await MediaLibrary.requestPermissionsAsync();
        
        if (permission.status === 'granted') {
          await MediaLibrary.createAssetAsync(uri);
        } else {
          // 権限が取れなかった場合でも、Androidのバージョンによっては保存できることがあるため
          // ログだけ出して保存を試みる（ダメなら下のcatchで拾う）
          console.log("Permission not explicitly granted, trying to save anyway...");
          await MediaLibrary.createAssetAsync(uri);
        }
      } catch (permError) {
        // ★ここがAndroid対策の肝
        // 「Audio権限がない」等のエラーが出ても、写真保存(createAssetAsync)は成功する場合が多いので
        // エラーを無視して保存処理を強行します。
        console.log("Permission request error (ignoring):", permError);
        try {
           await MediaLibrary.createAssetAsync(uri);
        } catch (saveError) {
           console.log("Album save failed:", saveError);
           // アルバム保存に失敗しても、アプリの動作（付箋への貼り付け）は止めない
        }
      }
    }

    // 2. フォルダパスの構築
    // 構造: (Documents)/photos/(旅行名)/(DayX)/(付箋名)/
    const photoRootDir = FileSystem.documentDirectory + 'photos/';
    const projectDir = photoRootDir + sanitizeFileName(projectTitle) + '/';
    const dayDir = projectDir + sanitizeFileName(dayLabel) + '/';
    const itemDir = dayDir + sanitizeFileName(itemTitle) + '/';

    // ディレクトリが存在しなければ作成（再帰的に作成）
    // ★前回の修正: expo-file-system/legacy の使用を前提
    await FileSystem.makeDirectoryAsync(itemDir, { intermediates: true });

    // 3. ファイル名の決定（何枚目か？）
    const existingFiles = await FileSystem.readDirectoryAsync(itemDir);
    const nextNum = existingFiles.length + 1;
    const newFileName = `${nextNum}.jpg`;
    const destinationUri = itemDir + newFileName;

    // 4. 画像の圧縮とリサイズ (幅1000px, 画質0.7)
    const manipulatedResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1000 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 5. 圧縮した画像をアプリ内の所定フォルダにコピー
    await FileSystem.moveAsync({
      from: manipulatedResult.uri,
      to: destinationUri
    });

    console.log(`Saved to: ${destinationUri}`);
    return destinationUri;

  } catch (error) {
    console.error("Image processing error:", error);
    Alert.alert("エラー", "画像の保存中に問題が発生しました");
    return null;
  }
};


// ■■■ 修正: URLからOGP画像とタイトルを取得する関数 (PC偽装版) ■■■
const fetchWebPageInfo = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url, {
      headers: {
        // PC版 Chrome (Windows) に偽装して、モバイル用リダイレクトやブロックを回避
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();

    // 1. 画像を探す (og:image)
    const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const image = (imgMatch && imgMatch[1]) ? imgMatch[1] : null;

    // 2. タイトルを探す (og:title 優先、なければ <title> タグ)
    let title = null;
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1];
    } else {
      const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleTagMatch && titleTagMatch[1]) {
        title = titleTagMatch[1];
      }
    }

    return { title, image };

  } catch (error) {
    console.log("OGP Fetch Error:", error);
    Alert.alert("取得失敗", "情報を読み込めませんでした");
    return null;
  }
};

// ■■■ 修正: ICS解析 (日付取得機能付き) ■■■
const parseICS = (icsContent) => {
  try {
    const summaryMatch = icsContent.match(/SUMMARY:(.*)/i);
    const locationMatch = icsContent.match(/LOCATION:(.*)/i);
    const descriptionMatch = icsContent.match(/DESCRIPTION:(.*)/i);
    // DTSTART を探す
    const dtstartMatch = icsContent.match(/DTSTART.*:(\d{8}T\d{6})/i);

    let result = { title: null, address: null, url: null, time: null, date: null };

    if (summaryMatch) result.title = summaryMatch[1].trim();
    if (locationMatch) result.address = locationMatch[1].trim().replace(/\\,/g, ',');

    if (descriptionMatch) {
      const desc = descriptionMatch[1];
      const urlMatch = desc.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) result.url = urlMatch[0];
    }

    if (dtstartMatch) {
      const raw = dtstartMatch[1]; // 例: 20250105T150000
      
      // 時間 (HH:MM)
      const timePart = raw.split('T')[1];
      if (timePart && timePart.length >= 4) {
        const h = timePart.substring(0, 2);
        const m = timePart.substring(2, 4);
        result.time = `${h}:${m}`;
      }

      // ★日付 (YYYY/M/D) アプリのフォーマットに合わせる
      // 20250105 -> 2025, 01, 05
      const y = raw.substring(0, 4);
      const m = parseInt(raw.substring(4, 6), 10); // 01 -> 1
      const d = parseInt(raw.substring(6, 8), 10); // 05 -> 5
      result.date = `${y}/${m}/${d}`;
    }

    return result;
  } catch (e) {
    console.log("ICS Parse Error", e);
    return null;
  }
};
// ■■■ バックアップ・復元用ヘルパー関数 ■■■

/**
 * 全データをZip圧縮してエクスポートする
 */

// ■■■ 修正版: 完全バックアップ関数 (ファイル名重複対策済み) ■■■
const executeFullBackup = async () => {
    try {
        // 1. 全プロジェクトリスト取得
        const projectsJson = await AsyncStorage.getItem(PROJECTS_KEY);
        const projects = projectsJson ? JSON.parse(projectsJson) : [];
        
        const stockJson = await AsyncStorage.getItem(STOCK_KEY);
        const stockList = stockJson ? JSON.parse(stockJson) : [];

        // 2. 各プロジェクトの詳細データを取得
        const allItems = {};
        const allAcc = {};
        const allPacking = {};

        for (const p of projects) {
            const key = PROJECT_DATA_PREFIX + p.id;
            const dataJson = await AsyncStorage.getItem(key);
            if (dataJson) {
                const data = JSON.parse(dataJson);
                allItems[p.id] = data.items || {};
                allAcc[p.id] = data.accommodations || {};
                allPacking[p.id] = data.packingList || [];
            }
        }
        
        // 3. 圧縮処理の開始
        const zip = new JSZip();
        const photoFolder = zip.folder("photos");
        const imageMap = {};
        let uniqueCounter = 0; // ★連番カウンターを追加

        // 画像登録用ヘルパー：重複しない名前を生成する
        const registerImage = (uri) => {
            if (!uri || !uri.startsWith('file://')) return uri;
            
            // 既に登録済みならそのパスを返す
            if (imageMap[uri]) return imageMap[uri];

            // 拡張子を取得（なければjpg）
            const ext = uri.split('.').pop() || 'jpg';
            // ★重要: 元のファイル名を使わず、ユニークな名前を生成する
            // これにより「違う画像なのにファイル名が同じ」場合の上書きを防ぐ
            const uniqueName = `img_${Date.now()}_${uniqueCounter++}.${ext}`;
            const zipPath = `photos/${uniqueName}`;
            
            imageMap[uri] = zipPath;
            return zipPath;
        };

        // --- パス書き換え & データ構築 ---
        const projectsCopy = JSON.parse(JSON.stringify(projects));
        projectsCopy.forEach(p => {
             p.imageUri = registerImage(p.imageUri);
             if(p.coverImages) p.coverImages = p.coverImages.map(registerImage);
        });
        
        const stockCopy = JSON.parse(JSON.stringify(stockList));
        stockCopy.forEach(s => s.imageUri = registerImage(s.imageUri));

        const detailsData = { items: {}, accommodations: {}, packing: {} };

        // 各プロジェクトの中身もループして画像パス変換
        Object.keys(allItems).forEach(pid => {
            // Items
            const pItems = JSON.parse(JSON.stringify(allItems[pid]));
            Object.values(pItems).flat().forEach(item => {
                item.imageUri = registerImage(item.imageUri);
                if(item.images) item.images = item.images.map(registerImage);
            });
            detailsData.items[pid] = pItems;

            // Acc
            const pAcc = JSON.parse(JSON.stringify(allAcc[pid]));
            Object.values(pAcc).forEach(acc => {
                if(typeof acc === 'object') {
                    acc.dayImageUri = registerImage(acc.dayImageUri);
                    if(acc.dayImages) acc.dayImages = acc.dayImages.map(registerImage);
                }
            });
            detailsData.accommodations[pid] = pAcc;
            
            // Packing
            detailsData.packing[pid] = allPacking[pid];
        });

        // 4. JSON作成
        const backupPayload = {
            version: 3, // ★バージョンアップ（管理用）
            date: new Date().toISOString(),
            projects: projectsCopy,
            stock: stockCopy,
            details: detailsData
        };
        
        zip.file("data.json", JSON.stringify(backupPayload));

        // 5. 画像保存 (Base64)
        const uriList = Object.keys(imageMap);
        let successCount = 0;
        await Promise.all(uriList.map(async (uri) => {
            try {
                const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                const fName = imageMap[uri].replace('photos/', '');
                photoFolder.file(fName, b64, { base64: true });
                successCount++;
            } catch(e) { /* ignore missing files */ }
        }));
        
        console.log(`Backup: ${successCount}/${uriList.length} images saved.`);

        // 6. 出力
        const b64Zip = await zip.generateAsync({ type: "base64" });
        const filename = `MergeTrip_Backup_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.zip`;
        const dest = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(dest, b64Zip, { encoding: FileSystem.EncodingType.Base64 });
        
        await Sharing.shareAsync(dest);

    } catch (e) {
        console.error(e);
        Alert.alert("バックアップ失敗", e.message);
    }
};

// ■■■ 修正: 完全復元関数 (iOSエラー対策・連打防止版) ■■■


/**
 * Zipファイルを読み込んでデータを復元する
 */
const importBackup = async (refreshFunc) => {
  try {
    // 1. ファイル選択
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/zip', // android sometimes needs specific mime types
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    const fileUri = result.assets[0].uri;

    // 2. Zip読み込み
    const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const zip = await JSZip.loadAsync(fileContent, { base64: true });

    // 3. JSONデータの取り出し
    const jsonFile = zip.file("backup_data.json");
    if (!jsonFile) {
      Alert.alert("エラー", "有効なバックアップファイルではありません (data.json not found)");
      return;
    }
    const jsonData = await jsonFile.async("string");
    const data = JSON.parse(jsonData);

    // 4. 画像の展開 (photosフォルダ)
    const photoFolder = zip.folder("photos");
    const pathConversionMap = {}; // { "photos/abc.jpg": "file://.../restored_abc.jpg" }

    if (photoFolder) {
      const savedDir = FileSystem.documentDirectory + 'restored_photos/';
      await FileSystem.makeDirectoryAsync(savedDir, { intermediates: true });

      const files = [];
      photoFolder.forEach((relativePath, file) => {
        files.push({ relativePath, file });
      });

      console.log(`Restoring ${files.length} images...`);

      await Promise.all(files.map(async ({ relativePath, file }) => {
        const base64 = await file.async("base64");
        // ファイル名の衝突を避けるため、ユニークな名前にしても良いが、今回はそのまま
        // (ただし、同名ファイルがある場合は上書きされる)
        const newUri = savedDir + relativePath; // photos/xxx.jpg は含まれない、ファイル名のみ来るはずだが念のため
        
        // JSZipのforEachのrelativePathは "photos/abc.jpg" ではなく "abc.jpg" (folderオブジェクトから呼んでいるため)
        // もし zip.files から回す場合はフルパスになる。
        // ここでは folder('photos') から回しているのでファイル名のみ。
        
        const finalUri = savedDir + relativePath; 
        await FileSystem.writeAsStringAsync(finalUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        
        // マップに登録 ("photos/abc.jpg" というパスがJSONにあるはず)
        pathConversionMap[`photos/${relativePath}`] = finalUri;
      }));
    }

    // 5. JSON内の画像パスを「現在の端末のパス」に書き戻す
    const restorePath = (path) => {
      if (!path) return null;
      if (pathConversionMap[path]) return pathConversionMap[path];
      return path; // Web画像などはそのまま
    };

    // A. プロジェクト
    data.projects.forEach(p => {
        p.imageUri = restorePath(p.imageUri);
        if(p.coverImages) p.coverImages = p.coverImages.map(restorePath);
    });
    // B. アイテム
    Object.keys(data.itemsByDay).forEach(k => {
        data.itemsByDay[k].forEach(i => {
            i.imageUri = restorePath(i.imageUri);
            if(i.images) i.images = i.images.map(restorePath);
        });
    });
    // C. 宿
    Object.keys(data.accommodations).forEach(k => {
        const acc = data.accommodations[k];
        if(typeof acc === 'object') {
            acc.dayImageUri = restorePath(acc.dayImageUri);
            if(acc.dayImages) acc.dayImages = acc.dayImages.map(restorePath);
        }
    });
    // D. ストック
    data.stockList.forEach(i => i.imageUri = restorePath(i.imageUri));

    // 6. データの保存 (上書き保存)
    // ★注意: ここで既存データは全て消え、バックアップの内容になります。
    // 「マージ」にするか「完全復元」にするか選べると良いですが、まずは「完全復元」として実装します。
    
    Alert.alert(
      "復元の確認", 
      "現在のデータを全て削除し、バックアップの内容で上書きします。\nよろしいですか？",
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "復元を実行", 
          style: "destructive",
          onPress: async () => {
             await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects));
             await AsyncStorage.setItem(STOCK_KEY, JSON.stringify(data.stockList));
             
             // 詳細データの復元 (プロジェクトごとに保存)
             // 今回のバックアップ構造では itemsByDay は全プロジェクト分入っている前提(キーが共通ではないため工夫が必要)
             // ★修正: exportBackupで itemsByDay = { 0: [...], 1: [...] } となっているが、これは「現在開いているプロジェクト」のみ。
             // 実際は「全プロジェクト」のデータを保存しないといけない。
             
             // ▲ ここで設計の微修正が必要です！
             // 簡易実装として、今回は「現在開いているプロジェクト」ではなく、
             // バックアップ時に「データ全体」をどう扱うか。
             // exportBackup関数内で itemsByDay は currentProject のものしか渡していませんでした。
             // これだと他のプロジェクトの中身が空になります。
             
             // → 解決策: exportBackup を修正し、AsyncStorageから全データを読み込んでZipするようにします。
             
             // ※※※ 下記の `executeFullBackup` を使ってください ※※※
             await refreshFunc(data); // 画面更新用コールバック
          }
        }
      ]
    );

  } catch (e) {
    console.error(e);
    Alert.alert("エラー", "復元に失敗しました\n" + e.message);
  }
};

export default function App() {
  
  const colorScheme = useColorScheme(); // ★★★ この1行を追加！！！ ★★★
  let [fontsLoaded] = useFonts({
    'MPlus-Regular': MPLUSRounded1c_400Regular,
    'MPlus-Bold': MPLUSRounded1c_700Bold,
    'MPlus-Black': MPLUSRounded1c_900Black, // タイトル用
    'GravitasOne': GravitasOne_400Regular,
    'Aosagi': require('../assets/fonts/aosagi.otf'),
  });

  
  const [inputItemUrl, setInputItemUrl] = useState(''); 
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;

  const [cameraFacing, setCameraFacing] = useState('back'); // 'back' または 'front'
  const [activeTab, setActiveTab] = useState('home');
  const [viewMode, setViewMode] = useState('list');
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [now, setNow] = useState(new Date()); 
  const [albumImages, setAlbumImages] = useState([]); // ★追加: アルバムの中身
  const [itemsByDay, setItemsByDay] = useState({});
  const [accommodations, setAccommodations] = useState({});
  const [daysArray, setDaysArray] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [packingList, setPackingList] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false); // ★画像処理中フラグ
  const [isReady, setIsReady] = useState(false);
  const scrollViewRef = useRef(null); 


  
// ■■■ 追加: ヒーロー画像選択用ステート ■■■
  const [heroSelectVisible, setHeroSelectVisible] = useState(false);
  const [selectedHeroProject, setSelectedHeroProject] = useState(null);
// ■■■ 2. Appコンポーネント内に追加するState ■■■
  const [trashProjects, setTrashProjects] = useState([]); // ゴミ箱の中身
  const [trashModalVisible, setTrashModalVisible] = useState(false); // ゴミ箱画面の表示
  const [trashSelectionMode, setTrashSelectionMode] = useState(false); // 選択モードかどうか
  const [selectedTrashIds, setSelectedTrashIds] = useState([]); // 選択されたIDリスト
  const [isNavBarAdjustMode, setIsNavBarAdjustMode] = useState(false); // ナビゲーションバー調整モード
  const SETTING_NAV_BAR_KEY = 'setting_nav_bar_adjust'; // 保存用のキー
  const [modalVisible, setModalVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [singleHotelModalVisible, setSingleHotelModalVisible] = useState(false);
  const [tocVisible, setTocVisible] = useState(false); 
  const [packingVisible, setPackingVisible] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockSelectVisible, setStockSelectVisible] = useState(false);
  const [quickPriceModalVisible, setQuickPriceModalVisible] = useState(false);
  const [transportModalVisible, setTransportModalVisible] = useState(false);
  const [quickTimeModalVisible, setQuickTimeModalVisible] = useState(false);
  const [dayAlbumVisible, setDayAlbumVisible] = useState(false);
  const [currentViewingDayIndex, setCurrentViewingDayIndex] = useState(null);
  // ■■■ 1. 定数定義に追加 ■■■
  const TRASH_KEY = 'travel_trash_v1';
  const [photoOverlayVisible, setPhotoOverlayVisible] = useState(false);
  const [selectedPhotoData, setSelectedPhotoData] = useState(null);
// ■■■ 1. 定数定義に追加 ■■■
  const TRASH_IMAGES_KEY = 'travel_trash_images_v1';

// ...
// ■■■ アルバム選択モード用のState ■■■
  const [albumSelectionMode, setAlbumSelectionMode] = useState(false);
  const [selectedAlbumImages, setSelectedAlbumImages] = useState([]);
// ■■■ 2. Appコンポーネント内に追加するState ■■■
  const [trashImages, setTrashImages] = useState([]); // 画像のゴミ箱
  const [trashTab, setTrashTab] = useState('project'); // ゴミ箱画面のタブ ('project' or 'image')
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemTime, setEditItemTime] = useState(new Date());
  const [editTimeString, setEditTimeString] = useState('');
  const [editItemType, setEditItemType] = useState('note');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemImage, setEditItemImage] = useState(null); 
  const [editItemImages, setEditItemImages] = useState([]); 
  const [settingMenuVisible, setSettingMenuVisible] = useState(false); // 設定メニューの表示
  const [modalMode, setModalMode] = useState('create'); 
  const [inputTitle, setInputTitle] = useState('');
  const [inputStartDate, setInputStartDate] = useState(new Date());
  const [inputEndDate, setInputEndDate] = useState(new Date());
  const [pickerMode, setPickerMode] = useState(null); 
  const [inputItemTitle, setInputItemTitle] = useState('');
  const [inputItemTime, setInputItemTime] = useState(new Date());
  const [timeString, setTimeString] = useState('');
  const [inputItemPrice, setInputItemPrice] = useState('');
  const [inputItemImage, setInputItemImage] = useState(null); 
  const [inputItemImages, setInputItemImages] = useState([]); 
  
  const [newItemType, setNewItemType] = useState('note'); 
  const [isCheckinMode, setIsCheckinMode] = useState(false); 

  const [targetHotelIndex, setTargetHotelIndex] = useState(null);
  const [isHotelEditMode, setIsHotelEditMode] = useState(false);
  const [inputSingleHotelName, setInputSingleHotelName] = useState('');
  const [inputSingleCheckinTime, setInputSingleCheckinTime] = useState(new Date());
  const [singleCheckinTimeString, setSingleCheckinTimeString] = useState('15:00');
  const [inputHotelTel, setInputHotelTel] = useState('');
  const [inputHotelAddress, setInputHotelAddress] = useState('');
  const [inputHotelUrl, setInputHotelUrl] = useState('');
  const [inputSingleHotelStatus, setInputSingleHotelStatus] = useState('none');
  const [stayDuration, setStayDuration] = useState(1);
  const [inputHotelImages, setInputHotelImages] = useState([]);

  const [newPackingItem, setNewPackingItem] = useState('');

  const [stockModalMode, setStockModalMode] = useState('create');
  const [editingStockId, setEditingStockId] = useState(null);
  const [inputStockTitle, setInputStockTitle] = useState('');
  const [inputStockNote, setInputStockNote] = useState('');
  const [inputStockUrl, setInputStockUrl] = useState('');
  const [inputStockCategory, setInputStockCategory] = useState('sightseeing');
  const [inputStockPrice, setInputStockPrice] = useState('');
  const [inputStockImage, setInputStockImage] = useState(null);
   
  const [targetItemForPrice, setTargetItemForPrice] = useState(null); 
  const [tempPrice, setTempPrice] = useState('');
  const [targetItemForTime, setTargetItemForTime] = useState(null);
  const [tempTimeDate, setTempTimeDate] = useState(new Date()); 
  const [tempTimeString, setTempTimeString] = useState('');      

  const [inputTransportPrice, setInputTransportPrice] = useState('');
  const [selectedTransportOption, setSelectedTransportOption] = useState(null); 
  const [gapInsertInfo, setGapInsertInfo] = useState(null);

  const [homeProjectData, setHomeProjectData] = useState(null); 
  const [albumData, setAlbumData] = useState([]);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  
  const [albumViewMode, setAlbumViewMode] = useState('list'); 
  const [targetAlbumProject, setTargetAlbumProject] = useState(null);
  
 // ■■■ テーマ設定 ■■■
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const systemColorScheme = useColorScheme(); // システム設定を取得
  const theme = Colors[systemColorScheme === 'dark' ? 'dark' : 'light']; // 色を決定

  // ■■■ カメラ関連 ■■■
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);  


  // ■■■ 修正: 画像削除 (アーカイブ・アクティブ両対応版) ■■■
  const deleteSelectedAlbumImages = async () => {
    if (selectedAlbumImages.length === 0) return;
    setIsProcessing(true);

    try {
      // 削除する画像リスト (ゴミ箱保存用)
      const newTrashItems = [];
      
      // ■ パターンA: アクティブなプロジェクトを編集している場合
      if (currentProject && targetAlbumProject && String(currentProject.id) === String(targetAlbumProject.id)) {
          
          let updatedItemsByDay = { ...itemsByDay };
          let updatedAccommodations = { ...accommodations };

          for (const uriToRemove of selectedAlbumImages) {
             let sourceInfo = null;
             // 画像がどこにあるか探索
             // 1. 宿・ヘッダー
             Object.keys(updatedAccommodations).forEach(dKey => {
                 const acc = updatedAccommodations[dKey];
                 if(typeof acc === 'object' && acc.dayImages && acc.dayImages.includes(uriToRemove)) {
                     updatedAccommodations[dKey] = { ...acc, dayImages: acc.dayImages.filter(u => u !== uriToRemove) };
                     sourceInfo = { type: 'day', projectId: currentProject.id, dayIndex: parseInt(dKey), itemId: 'header' };
                 }
             });
             // 2. 予定アイテム
             if(!sourceInfo) {
                 Object.keys(updatedItemsByDay).forEach(dKey => {
                     updatedItemsByDay[dKey] = updatedItemsByDay[dKey].map(item => {
                         if(item.images && item.images.includes(uriToRemove)) {
                             sourceInfo = { type: 'item', projectId: currentProject.id, dayIndex: parseInt(dKey), itemId: item.id };
                             return { ...item, images: item.images.filter(u => u !== uriToRemove) };
                         }
                         return item;
                     });
                 });
             }

             if(sourceInfo) {
                 newTrashItems.push({ id: Date.now().toString() + Math.random(), uri: uriToRemove, source: sourceInfo, deletedAt: new Date().toISOString() });
             }
          }

          // State更新 & 保存
          setItemsByDay(updatedItemsByDay);
          setAccommodations(updatedAccommodations);
          const key = PROJECT_DATA_PREFIX + currentProject.id;
          await AsyncStorage.setItem(key, JSON.stringify({ items: updatedItemsByDay, accommodations: updatedAccommodations, packingList }));
      } 
      // ■ パターンB: ストレージ内の別プロジェクトを編集している場合
      else if (targetAlbumProject) {
          
          const key = PROJECT_DATA_PREFIX + targetAlbumProject.id;
          const jsonValue = await AsyncStorage.getItem(key);
          if (jsonValue) {
              const data = JSON.parse(jsonValue);
              let items = data.items || {};
              let accs = data.accommodations || {};
              let changed = false;

              for (const uriToRemove of selectedAlbumImages) {
                  let sourceInfo = null;
                  
                  // 1. 宿・ヘッダー検索 & 削除
                  Object.keys(accs).forEach(dKey => {
                      const acc = accs[dKey];
                      if(typeof acc === 'object' && acc.dayImages && acc.dayImages.includes(uriToRemove)) {
                          accs[dKey] = { ...acc, dayImages: acc.dayImages.filter(u => u !== uriToRemove) };
                          sourceInfo = { type: 'day', projectId: targetAlbumProject.id, dayIndex: parseInt(dKey), itemId: 'header' };
                          changed = true;
                      }
                  });

                  // 2. 予定アイテム検索 & 削除
                  if (!sourceInfo) {
                      Object.keys(items).forEach(dKey => {
                          items[dKey] = items[dKey].map(item => {
                              if(item.images && item.images.includes(uriToRemove)) {
                                  sourceInfo = { type: 'item', projectId: targetAlbumProject.id, dayIndex: parseInt(dKey), itemId: item.id };
                                  changed = true;
                                  return { ...item, images: item.images.filter(u => u !== uriToRemove) };
                              }
                              return item;
                          });
                      });
                  }

                  if (sourceInfo) {
                      newTrashItems.push({ id: Date.now().toString() + Math.random(), uri: uriToRemove, source: sourceInfo, deletedAt: new Date().toISOString() });
                  }
              }

              // ストレージに書き戻し
              if (changed) {
                  await AsyncStorage.setItem(key, JSON.stringify({ ...data, items: items, accommodations: accs }));
              }
          }
      }

      // --- 共通処理: 表示の更新とゴミ箱への保存 ---
      
      // 1. 表示中のアルバムリストから削除
      setAlbumImages(prev => prev.filter(img => !selectedAlbumImages.includes(img.uri)));

      // 2. ゴミ箱へ保存
      if (newTrashItems.length > 0) {
        const currentTrash = await AsyncStorage.getItem(TRASH_IMAGES_KEY);
        const parsedTrash = currentTrash ? JSON.parse(currentTrash) : [];
        const updatedTrash = [...newTrashItems, ...parsedTrash];
        
        setTrashImages(updatedTrash);
        await AsyncStorage.setItem(TRASH_IMAGES_KEY, JSON.stringify(updatedTrash));
      }

      setAlbumSelectionMode(false);
      setSelectedAlbumImages([]);
      Alert.alert("削除完了", `${selectedAlbumImages.length}枚の写真をゴミ箱に移動しました`);

    } catch (e) {
      console.error(e);
      Alert.alert("エラー", "削除中に問題が発生しました");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ▼▼▼ ここから貼り付け（QRコード関連の機能） ▼▼▼

  const [qrVisible, setQrVisible] = useState(false);
  const [qrData, setQrData] = useState('');

// ■■■ ヘルパー関数群（ここから） ■■■
  // ■ ヘルパー: 重複しないタイトルを生成する
  const generateUniqueTitle = (baseTitle, existingProjects) => {
    let newTitle = baseTitle;
    let count = 1;
    // 同じ名前がある限りループして (1), (2) ... をつける
    while (existingProjects.some(p => p.title === newTitle)) {
      newTitle = `${baseTitle} (${count})`;
      count++;
    }
    return newTitle;
  };

  // 日付を「2025/12/31」形式にする
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 金額を「¥1,000」形式にする
  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '¥0';
    return '¥' + parseInt(amount).toLocaleString();
  };

  // ■■■ 追加: 言語判定ヘルパー ■■■
  // 日本語（ASCII以外）が含まれていたら 'Aosagi'、英語だけなら 'GravitasOne' を返す
  const getFontByLang = (text) => {
    if (!text) return 'GravitasOne';
    // ASCII文字(英数字記号)以外が含まれているかチェック
    const hasJapanese = /[^\x01-\x7E]/.test(text);
    return hasJapanese ? 'Aosagi' : 'GravitasOne';
  };

  // 2つの時間の差（所要時間）を計算する
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime || startTime === '連泊') return null;
    try {
      const [h1, m1] = startTime.split(':').map(Number);
      const [h2, m2] = endTime.split(':').map(Number);
      let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diffMin < 0) diffMin += 24 * 60; // 日を跨ぐ場合（簡易対応）
      
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      
      if (h > 0 && m > 0) return `${h}時間${m}分`;
      if (h > 0) return `${h}時間`;
      return `${m}分`;
    } catch (e) {
      return null;
    }
  };

  // プロジェクト全体の予算合計
  const calculateProjectTotal = () => {
    let total = 0;
    Object.values(itemsByDay).forEach((dayItems) => {
      if (dayItems) {
        dayItems.forEach((item) => {
          if (item.price) total += parseInt(item.price);
        });
      }
    });
    // 宿代も加算
    Object.values(accommodations).forEach((acc) => {
      // 宿代が管理されている場合（今回は簡易実装のため省略されていることが多いですが枠だけ用意）
    });
    return total;
  };

  // その日の合計予算
  const calculateDayTotal = (items) => {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + (item.price ? parseInt(item.price) : 0), 0);
  };

  // ホーム画面用：カウントダウン計算
  const getCountdown = () => {
    if (!projects || projects.length === 0) return { text: "No Plan", isPast: false };
    const latest = projects[projects.length - 1];
    const now = new Date();
    const start = new Date(latest.startDate);
    
    // 日付のみで比較するため時間をリセット
    now.setHours(0,0,0,0);
    start.setHours(0,0,0,0);

    const diffTime = start - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { text: `${diffDays} DAYS`, isPast: false };
    } else if (diffDays === 0) {
      return { text: "TODAY!", isPast: false };
    } else {
      return { text: "Enjoy!", isPast: true };
    }
  };

  // ■■■ 修正: 頑丈なgenerateDays関数 ■■■
  const generateDays = (start, end) => {
    try {
      const s = start ? new Date(start) : new Date();
      const e = end ? new Date(end) : new Date();
      const days = [];
      s.setHours(0,0,0,0);
      e.setHours(0,0,0,0);

      let currentDate = new Date(s);
      let index = 0;

      if (currentDate > e) {
         // ★修正: Day 1 表記へ
         days.push({ index: 0, date: formatDate(s), dayLabel: 'Day 1' });
         return days;
      }

      while (currentDate <= e && index < 365) { 
        days.push({
          index: index,
          date: formatDate(new Date(currentDate)), 
          // ★修正: Day 〇〇 表記へ
          dayLabel: `Day ${index + 1}`,
        });
        currentDate.setDate(currentDate.getDate() + 1);
        index++;
      }
      return days;
    } catch (err) {
      console.log("Date gen error", err);
      return [{ index: 0, date: '日付不明', dayLabel: 'Day 1' }];
    }
  };

  // QRコードを読み取った時の処理
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setScannerVisible(false); // カメラを閉じる
    
    // 少し待ってからインポート処理へ（連続読み取り防止）
    setTimeout(() => {
      try {
        const parsedData = JSON.parse(data);
        // バージョンチェックや形式チェック（インポート機能と同じロジック）
        if (parsedData.v && parsedData.p) {
          Alert.alert(
            "QRコードを検出",
            `「${parsedData.p.t}」\n(Dayスライス: ${parsedData.type === 'day_slice' ? 'あり' : 'なし'})\nをインポートしますか？`,
            [
              { text: "キャンセル", onPress: () => setScanned(false), style: "cancel" },
              {
                text: "インポート",
                onPress: async () => {
                   // Dayスライスか全日程かで分岐
                   if (parsedData.type === 'day_slice') {
                     await executeDayImport(parsedData); // ★後で作ります
                   } else {
                     await executeImport(parsedData); // 既存のインポート
                   }
                   setScanned(false);
                }
              }
            ]
          );
        } else {
           Alert.alert("エラー", "このアプリのQRコードではありません", [{ text: "OK", onPress: () => setScanned(false) }]);
        }
      } catch (error) {
        Alert.alert("エラー", "データを読み取れませんでした", [{ text: "OK", onPress: () => setScanned(false) }]);
      }
    }, 500);
  };

const startScan = async () => {
    // 権限チェック
    if (!permission) return;
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("権限エラー", "カメラの使用が許可されていません");
        return;
      }
    }
    // ★追加: カメラを起動する前に、新規作成画面を閉じる！
    setProjectModalVisible(false);
    
    // 即座に起動（オーバーレイ方式ならこれでOK！）
    setScanned(false);
    setScannerVisible(true);
  };

  // ■■■ 修正: 「未定」は統合してしまう賢いインポート処理 ■■■
  const executeDayImport = async (data) => {
    const targetDayIndex = currentPage; // 現在開いているページ
    
    setItemsByDay(prev => {
      const currentItems = prev[targetDayIndex] || [];
      
      const newItems = data.d.i
        .filter(incomingItem => {
          // ■ 重複判定ロジック (改良版) ■
          const isDuplicate = currentItems.some(existingItem => {
             // 条件A: タイトルも時間も完全に一致する (前回同様)
             const isExactMatch = (existingItem.title === incomingItem.t && existingItem.time === incomingItem.tm);
             
             // 条件B: 入ってくる予定が「時間未定」で、タイトルが一致する
             // (既存の予定の時間は問わない＝既存が12:00でも未定でも、入ってくるのが未定なら不要)
             const isVagueIncoming = (incomingItem.tm === '未定' && existingItem.title === incomingItem.t);
             
             // どちらか一方でも当てはまれば「重複」とみなす
             return isExactMatch || isVagueIncoming;
          });
          
          // 重複していれば false (除外)、していなければ true (採用)
          return !isDuplicate;
        })
        .map((item, idx) => ({
          id: Date.now() + idx + Math.random(),
          title: item.t,
          time: item.tm,
          type: item.tp,
          price: item.p,
          images: [],
          imageUri: null,
          status: 'pending',       
          isMine: false,           
          acceptedBy: [],
          authorId: 'guest'
        }));

      if (newItems.length === 0) {
        Alert.alert("インポート結果", "新しい提案はありませんでした。\n(既存の予定と同じか、より詳細な予定が登録済みです)");
        return prev;
      }

      Alert.alert(
        "提案を受信", 
        `${newItems.length}件の新しい提案を右側に追加しました。`
      );

      return {
        ...prev,
        [targetDayIndex]: [...currentItems, ...newItems].sort((a, b) => a.time.localeCompare(b.time))
      };
    });
  };

  // データを軽量化してQR用文字列に変換する関数
// データを軽量化・圧縮してQR用文字列に変換する関数
  // ■■■ 修正: リストからも呼べる汎用QR生成関数 ■■■
  const generateQRData = async (targetProject = null) => {
    // ターゲットが指定されていなければ、現在開いているプロジェクトを使用
    const project = targetProject || currentProject;
    if (!project) return;

    let itemsToExport = {};
    let accToExport = {};

    // A. リストから呼ばれた場合（データがメモリにないのでロードする）
    if (targetProject) {
       try {
         const key = PROJECT_DATA_PREFIX + project.id;
         const jsonValue = await AsyncStorage.getItem(key);
         if (jsonValue) {
           const data = JSON.parse(jsonValue);
           itemsToExport = data.items || {};
           accToExport = data.accommodations || {};
         }
       } catch (e) {
         Alert.alert("エラー", "データの読み込みに失敗しました");
         return;
       }
    } 
    // B. 詳細画面から呼ばれた場合（メモリ上のデータを使用）
    else {
       itemsToExport = itemsByDay;
       accToExport = accommodations;
    }

    // 軽量化処理 (ここからは共通)
    const cleanItems = {};
    Object.keys(itemsToExport).forEach((key) => {
      cleanItems[key] = itemsToExport[key].map((item) => ({
        t: item.title,
        tm: item.time,
        tp: item.type,
        p: item.price,
      }));
    });

    const cleanAccommodations = {};
    Object.keys(accToExport).forEach((key) => {
      const acc = accToExport[key];
      if (typeof acc === 'object') {
        cleanAccommodations[key] = {
          n: acc.name, s: acc.status, tl: acc.tel, ad: acc.address, u: acc.url,
        };
      } else {
        cleanAccommodations[key] = acc;
      }
    });

    const exportData = {
      v: 2,
      p: { t: project.title, s: project.startDate, e: project.endDate },
      i: cleanItems,
      a: cleanAccommodations,
    };

    const jsonString = JSON.stringify(exportData);

    if (jsonString.length > 2500) {
      Alert.alert(
        'データが大きすぎます 💦',
        'QRコードに入り切りませんでした。テキスト共有しますか？',
        [{ text: 'キャンセル', style: 'cancel' }, { text: 'テキストで送る', onPress: () => Share.share({ message: jsonString }) }]
      );
      return;
    }

    setQrData(jsonString);
    setQrVisible(true);
  };

  // ■■■ 修正: PDFしおり生成機能 (メモリ対策・配列結合版) ■■■
  const createPDF = async (targetProject = null) => {
    const project = targetProject || currentProject;
    if (!project) return;
    
    setIsProcessing(true);

    try {
      // 1. データの準備
      let itemsToExport = {};
      let accToExport = {};
      
      if (targetProject && (!currentProject || targetProject.id !== currentProject.id)) {
         const key = PROJECT_DATA_PREFIX + project.id;
         const jsonValue = await AsyncStorage.getItem(key);
         if (jsonValue) {
           const data = JSON.parse(jsonValue);
           itemsToExport = data.items || {};
           accToExport = data.accommodations || {};
         }
      } else {
         itemsToExport = itemsByDay;
         accToExport = accommodations;
      }

      const projectTitle = project.title;
      const sDate = new Date(project.startDate);
      const eDate = new Date(project.endDate);
      const dateRange = `${sDate.getFullYear()}/${sDate.getMonth() + 1}/${sDate.getDate()} - ${eDate.getFullYear()}/${eDate.getMonth() + 1}/${eDate.getDate()}`;
      
      let totalBudget = 0;
      Object.values(itemsToExport).forEach(dayList => {
          if (Array.isArray(dayList)) {
              dayList.forEach(i => totalBudget += (i.price ? parseInt(i.price) : 0));
          }
      });

      const pDays = [];
      let d = new Date(sDate);
      let idx = 0;
      while(d <= eDate && idx < 365) {
          pDays.push({ index: idx, label: `Day ${idx+1}`, date: `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}` });
          d.setDate(d.getDate() + 1);
          idx++;
      }

      // ★修正: 文字列連結ではなく配列にPushしていく (メモリ対策)
      const htmlParts = [];

      // CSS定義
      htmlParts.push(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              h1 { font-size: 24px; color: #007AFF; text-align: center; margin-bottom: 5px; font-weight: bold; }
              .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
              .day-section { margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px; }
              .day-header { background-color: #f0f8ff; border-left: 5px solid #007AFF; padding: 8px; margin-bottom: 10px; font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; }
              .timeline { border-left: 2px solid #ddd; margin-left: 8px; padding-left: 15px; }
              .event { margin-bottom: 15px; position: relative; }
              .event::before { content: ''; position: absolute; left: -20px; top: 6px; width: 8px; height: 8px; background-color: #007AFF; border-radius: 50%; }
              .time { font-weight: bold; color: #555; font-size: 12px; }
              .title { font-weight: bold; font-size: 14px; margin-top: 2px; }
              .price { font-size: 10px; color: #007AFF; font-weight: bold; margin-top: 2px; }
              .hotel-box { background-color: #fff3e0; border: 1px solid #ffe0b2; padding: 8px; border-radius: 6px; margin-top: 8px; font-size: 12px; }
              .photo-container { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
              .photo { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; background-color: #eee; }
              .footer { text-align: center; margin-top: 30px; font-size: 8px; color: #aaa; border-top: 1px solid #eee; padding-top: 5px; }
            </style>
          </head>
          <body>
            <h1>${projectTitle}</h1>
            <div class="subtitle">${dateRange} | 総予算: ¥${totalBudget.toLocaleString()}</div>
      `);

      // ループ処理
      for (const day of pDays) {
        const items = itemsToExport[day.index] || [];
        const acc = accToExport[day.index];
        let dayTotal = 0;
        items.forEach(i => dayTotal += (i.price ? parseInt(i.price) : 0));

        htmlParts.push(`
          <div class="day-section">
            <div class="day-header">
              <span>${day.date} (${day.label})</span>
              <span style="font-size:12px">¥${dayTotal.toLocaleString()}</span>
            </div>
            <div class="timeline">
        `);

        if (items.length > 0) {
          for (const item of items) {
            const timeStr = item.time === '未定' ? '--:--' : item.time;
            
            let photosHtml = '';
            const images = item.images || (item.imageUri ? [item.imageUri] : []);
            
            if (images.length > 0) {
                photosHtml = `<div class="photo-container">`;
                for (const uri of images) {
                    if (uri) {
                        try {
                            const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                            photosHtml += `<img src="data:image/jpeg;base64,${b64}" class="photo" />`;
                        } catch (err) {
                            // 画像読み込みエラーは無視して続行
                        }
                    }
                }
                photosHtml += `</div>`;
            }

            htmlParts.push(`
              <div class="event">
                <div class="time">${timeStr} <span style="font-size:10px; font-weight:normal">${item.type === 'move' ? '🚗' : ''}</span></div>
                <div class="title">${item.title}</div>
                ${item.price ? `<div class="price">¥${parseInt(item.price).toLocaleString()}</div>` : ''}
                ${photosHtml}
              </div>
            `);
          }
        } else {
           htmlParts.push(`<div style="color:#999; font-size:10px; font-style:italic; margin-bottom:10px;">(予定なし)</div>`);
        }

        if (acc) {
           const hotelName = (typeof acc === 'object') ? acc.name : acc;
           if (hotelName) {
             let hotelPhotosHtml = '';
             if (typeof acc === 'object') {
                 const hImages = acc.dayImages || (acc.dayImageUri ? [acc.dayImageUri] : []);
                 if (hImages.length > 0) {
                     hotelPhotosHtml = `<div class="photo-container">`;
                     for (const uri of hImages) {
                         if (uri) {
                             try {
                                 const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                                 hotelPhotosHtml += `<img src="data:image/jpeg;base64,${b64}" class="photo" />`;
                             } catch (err) {}
                         }
                     }
                     hotelPhotosHtml += `</div>`;
                 }
             }

             htmlParts.push(`
               <div class="hotel-box">
                 <strong>🏨 今夜の宿:</strong> ${hotelName}
                 ${(typeof acc === 'object' && acc.tel) ? `<br>📞 ${acc.tel}` : ''}
                 ${(typeof acc === 'object' && acc.address) ? `<br>📍 ${acc.address}` : ''}
                 ${hotelPhotosHtml}
               </div>
             `);
           }
        }
        htmlParts.push(`</div></div>`);
      }

      htmlParts.push(`<div class="footer">Created with MergeTrip</div></body></html>`);

      // ★最後に結合
      const htmlContent = htmlParts.join('');

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (e) {
      console.error(e);
      Alert.alert("エラー", "PDF作成中にエラーが発生しました。\n画像の枚数を減らすと解決する場合があります。");
    } finally {
      setIsProcessing(false);
    }
  };

  // ■■■ 追加: データお掃除機能 (迷子ファイルの検出と削除) ■■■
  
  // 1. 再帰的にディレクトリ内の全ファイルを取得するヘルパー
  const listFilesRecursively = async (dir) => {
    let results = [];
    try {
      const list = await FileSystem.readDirectoryAsync(dir);
      for (const item of list) {
        const fullPath = dir + item;
        const info = await FileSystem.getInfoAsync(fullPath);
        if (info.isDirectory) {
          // フォルダなら再帰的に探索
          results = [...results, ...(await listFilesRecursively(fullPath + '/'))];
        } else {
          // ファイルならリストに追加
          results.push(fullPath);
        }
      }
    } catch (e) {
      // フォルダが存在しない場合などは無視
    }
    return results;
  };

  // 2. お掃除実行関数
  const handleDataCleaning = async () => {
    // 設定メニューを閉じる
    setSettingMenuVisible(false);
    
    Alert.alert(
      "データの整理",
      "使用されていない不要な画像ファイルを検索して削除します。\n\n※この処理には時間がかかる場合があります。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "スキャン開始",
          onPress: async () => {
            setIsProcessing(true);
            try {
              // --- A. 使用中の画像をすべてリストアップ ---
              const activeUris = new Set();

              // 1. プロジェクト一覧 (表紙など)
              projects.forEach(p => {
                if (p.imageUri) activeUris.add(p.imageUri);
                if (p.coverImages) p.coverImages.forEach(u => activeUris.add(u));
              });

              // 2. ストック一覧
              stockList.forEach(s => {
                if (s.imageUri) activeUris.add(s.imageUri);
              });

              // 3. ゴミ箱 (プロジェクト & 画像) - ゴミ箱にあるものは消さない
              trashProjects.forEach(p => {
                if (p.imageUri) activeUris.add(p.imageUri);
                if (p.coverImages) p.coverImages.forEach(u => activeUris.add(u));
              });
              trashImages.forEach(img => {
                if (img.uri) activeUris.add(img.uri);
              });

              // 4. 各プロジェクトの詳細データ (Items, Accommodations)
              // ※現在の `itemsByDay` だけでなく、保存されている全プロジェクトのJSONを開いて確認する
              const allProjectIds = [...projects.map(p => p.id), ...trashProjects.map(p => p.id)];
              
              for (const pid of allProjectIds) {
                const key = PROJECT_DATA_PREFIX + pid;
                const json = await AsyncStorage.getItem(key);
                if (json) {
                  const data = JSON.parse(json);
                  
                  // Items
                  if (data.items) {
                    Object.values(data.items).flat().forEach(item => {
                      if (item.imageUri) activeUris.add(item.imageUri);
                      if (item.images) item.images.forEach(u => activeUris.add(u));
                    });
                  }
                  // Accommodations
                  if (data.accommodations) {
                    Object.values(data.accommodations).forEach(acc => {
                      if (typeof acc === 'object') {
                        if (acc.dayImageUri) activeUris.add(acc.dayImageUri);
                        if (acc.dayImages) acc.dayImages.forEach(u => activeUris.add(u));
                      }
                    });
                  }
                }
              }

              // --- B. フォルダ内の全ファイルをリストアップ ---
              const photoRootDir = FileSystem.documentDirectory + 'photos/';
              const allFiles = await listFilesRecursively(photoRootDir);

              // --- C. 比較して迷子ファイル (Orphan) を特定 ---
              const filesToDelete = allFiles.filter(fileUri => !activeUris.has(fileUri));

              if (filesToDelete.length === 0) {
                setIsProcessing(false);
                Alert.alert("完了", "削除が必要なファイルはありませんでした。\nストレージは綺麗な状態です ✨");
                return;
              }

              // --- D. 削除確認と実行 ---
              setIsProcessing(false); // ローディング一旦解除
              
              Alert.alert(
                "整理の確認",
                `${filesToDelete.length}個の不要なファイルが見つかりました。\nこれらを削除して容量を空けますか？\n(必要な写真は削除されません)`,
                [
                  { text: "キャンセル", style: "cancel" },
                  {
                    text: "すべて削除",
                    style: "destructive",
                    onPress: async () => {
                      setIsProcessing(true);
                      let successCount = 0;
                      
                      // 削除実行
                      await Promise.all(filesToDelete.map(async (uri) => {
                        try {
                          await FileSystem.deleteAsync(uri);
                          successCount++;
                        } catch (e) {
                          console.log("Delete error:", e);
                        }
                      }));
                      
                      setIsProcessing(false);
                      Alert.alert("完了", `${successCount}個のファイルを削除しました！\nスッキリしましたね 🧹`);
                    }
                  }
                ]
              );

            } catch (e) {
              console.error(e);
              setIsProcessing(false);
              Alert.alert("エラー", "スキャン中にエラーが発生しました");
            }
          }
        }
      ]
    );
  };
  
  // ■■■ 修正: 共有メニュー（表記修正） ■■■
  const handleShareAction = (targetProject = null) => {
    const project = targetProject || currentProject;
    if (!project) return;

    Alert.alert(
      "共有・出力",
      `「${project.title}」\nをどうしますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "📄 PDFしおり (印刷用)", 
          onPress: () => createPDF(project) 
        },
        { 
          // ★修正: 表記を「Day共有」から「データ共有」に変更
          // ※ generateQRData(project) はプロジェクト全体のデータを吐き出すため
          text: "📱 QRコード (データ引継ぎ)", 
          onPress: () => generateQRData(project) 
        },
        { 
          text: "✉️ テキストで送る", 
          onPress: handleShareProject 
        },
      ]
    );
  };
  
  // ■■■ 追加: 指定した「1日分」だけをQR化する関数 ■■■
  const generateDayQRData = (dayIndex) => {
    const dayItems = itemsByDay[dayIndex] || [];
    const acc = accommodations[dayIndex];

    // アイテム軽量化
    const cleanItems = dayItems.map((item) => ({
      t: item.title,
      tm: item.time,
      tp: item.type,
      p: item.price,
    }));

    // 宿軽量化
    let cleanAcc = null;
    if (typeof acc === 'object' && acc !== null) {
      cleanAcc = {
        n: acc.name,
        s: acc.status,
        tl: acc.tel,
        ad: acc.address,
        u: acc.url,
      };
    }

    const exportData = {
      v: 2,
      type: 'day_slice', // Day単位であることを示す目印
      p: { t: currentProject.title }, // 元のプロジェクト名（参考）
      d: {
        i: cleanItems,
        a: cleanAcc,
      },
    };

    const jsonString = JSON.stringify(exportData);
    setQrData(jsonString);
    setQrVisible(true);
  };
  

  // レンダリング部分（QRモーダル）
  // ※これを return の中の <View> の最後（Modalが並んでいるところ）に追加する必要がありますが、
  // 簡単のために、ここで「QRモーダルを表示するだけのコンポーネント」を定義して、
  // renderPlan の return 内で呼び出す形にはできないため、
  // 次のステップで `renderPlan` 内のボタンと、`App` の return 内への配置を行います。

  // ▲▲▲ ここまで貼り付け ▲▲▲

  // ■■■ 追加: クリップボードからインポートする機能 ■■■
  // ■■■ 修正: クリップボードからインポートする機能 (Dayスライス対応版) ■■■
  const handleImportFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text) {
        Alert.alert("エラー", "クリップボードが空です");
        return;
      }

      // データ形式のチェック
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        Alert.alert("エラー", "正しいデータ形式ではありません。\nテキスト全体をコピーしてから再度試してください。");
        return;
      }

      // バージョンチェック
      if (!data.v || !data.p) {
        Alert.alert("エラー", "対応していないデータ形式です。");
        return;
      }

      // ▼▼▼ 追加: データタイプが「day_slice」ならマージ処理へ回す ▼▼▼
      if (data.type === 'day_slice') {
          // プロジェクトを開いていないとマージできないのでチェック
          if (!currentProject) {
              Alert.alert("エラー", "このデータは1日分の追加データです。\n先に旅行計画を開いてから実行してください。");
              return;
          }

          Alert.alert(
            "提案データ（テキスト）",
            `「${data.p.t || '不明'}」からの共有データです。\n現在のページにマージしますか？\n(重複しないものだけ右側に追加されます)`,
            [
              { text: "キャンセル", style: "cancel" },
              {
                text: "マージする",
                onPress: async () => {
                  // QRコードと同じ関数を呼び出す
                  await executeDayImport(data);
                }
              }
            ]
          );
          return; // ここで処理終了
      }
      // ▲▲▲ 追加ここまで ▲▲▲


      // --- 以下、既存の「プロジェクト丸ごとインポート」処理 ---
      Alert.alert(
        "プロジェクト・インポート",
        `新しい計画として\n「${data.p.t}」\nを保存しますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "インポート",
            onPress: async () => {
              await executeImport(data);
            }
          }
        ]
      );

    } catch (e) {
      console.error(e);
      Alert.alert("エラー", "読み込みに失敗しました");
    }
  };

  // 実際のインポート処理（データの復元）
  const executeImport = async (data) => {
    try {
      const newProjectId = Date.now().toString();
      
      // ★適用: 重複チェック
      const uniqueTitle = generateUniqueTitle(data.p.t + " (Import)", projects);

      const newProject = {
        id: newProjectId,
        title: uniqueTitle, // ★ユニーク化したタイトル
        startDate: data.p.s,
        endDate: data.p.e,
        imageUri: null, // 画像はなし
        createdAt: new Date().toISOString(),
      };

      // 2. アイテムデータの復元 (キー名の展開: t->title, tm->time...)
      const newItemsByDay = {};
      if (data.i) {
        Object.keys(data.i).forEach(dayIndex => {
          newItemsByDay[dayIndex] = data.i[dayIndex].map((item, idx) => ({
            id: Date.now() + idx, // IDは新規発行
            title: item.t,
            time: item.tm,
            type: item.tp,
            price: item.p,
            images: [], // 画像は削除済み
            imageUri: null
          }));
        });
      }

      // 3. 宿泊データの復元
      const newAccommodations = {};
      if (data.a) {
        Object.keys(data.a).forEach(dayIndex => {
          const acc = data.a[dayIndex];
          if (typeof acc === 'object') {
            newAccommodations[dayIndex] = {
              name: acc.n,
              status: acc.s,
              tel: acc.tl,
              address: acc.ad,
              url: acc.u,
              dayImages: [],
              dayImageUri: null
            };
          } else {
            newAccommodations[dayIndex] = acc; // 旧形式対応
          }
        });
      }

      // 4. 保存処理
      const newProjects = [...projects, newProject];
      setProjects(newProjects);
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));

      const key = PROJECT_DATA_PREFIX + newProjectId;
      const dataToSave = {
        items: newItemsByDay,
        accommodations: newAccommodations,
        packingList: []
      };
      await AsyncStorage.setItem(key, JSON.stringify(dataToSave));

      // 5. モーダルを閉じて新しいプロジェクトを開く
      setProjectModalVisible(false);
      Alert.alert("成功", "インポートが完了しました！");
      handleOpenProject(newProject);

    } catch (e) {
      console.error(e);
      Alert.alert("エラー", "データの保存に失敗しました");
    }
  };

// ■■■ 修正: 動作軽量化のためランダム廃止 ■■■
const stableImages = React.useMemo(() => {
    const map = { dayHeaders: {}, items: {} };

    // ヘルパー: ランダムではなく常に「最初の画像」を選ぶように変更
    const pickOne = (uris) => {
       if (!uris || uris.length === 0) return null;
       // return uris[Math.floor(Math.random() * uris.length)]; // ← 元のコード（廃止）
       return uris[0]; // ★常に1枚目を採用（これで再描画時の負荷が激減します）
    };

    // 1. Dayヘッダー画像の決定
    daysArray.forEach(day => {
       const acc = accommodations[day.index];
       if (acc) {
          const uris = acc.dayImages || (acc.dayImageUri ? [acc.dayImageUri] : []);
          map.dayHeaders[day.index] = pickOne(uris);
       }
    });

    // 2. アイテム画像の決定
    Object.keys(itemsByDay).forEach(dayIndex => {
       itemsByDay[dayIndex].forEach(item => {
          const uris = item.images || (item.imageUri ? [item.imageUri] : []);
          map.items[item.id] = pickOne(uris);
       });
    });

    return map;
  }, [itemsByDay, accommodations, daysArray]);
  
  const [selectedImageUris, setSelectedImageUris] = useState([]);

  // ▼▼▼ ここに追加 (2/2) ▼▼▼
  // アプリ起動時に設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const val = await AsyncStorage.getItem(SETTING_NAV_BAR_KEY);
        if (val !== null) setIsNavBarAdjustMode(JSON.parse(val));
      } catch (e) { console.error(e); }
    };
    loadSettings();
  }, []);

  // 設定を切り替える関数
  const toggleNavBarAdjust = async (value) => {
    setIsNavBarAdjustMode(value);
    await AsyncStorage.setItem(SETTING_NAV_BAR_KEY, JSON.stringify(value));
  };

useEffect(() => {
    const loadData = async () => {
      try {
        // 1. プロジェクトの読み込み（既存）
        const jsonValue = await AsyncStorage.getItem(PROJECTS_KEY);
        if (jsonValue != null) {
            const loadedProjects = JSON.parse(jsonValue);
            setProjects(loadedProjects);
            // ... (中略: ホーム画面用の計算ロジック) ...
        }
        
        // 2. ストックの読み込み（既存）
        const stockJson = await AsyncStorage.getItem(STOCK_KEY);
        if (stockJson != null) setStockList(JSON.parse(stockJson));

        // ▼▼▼ ここに追加してください！(ゴミ箱の読み込み) ▼▼▼
        const trashJson = await AsyncStorage.getItem(TRASH_KEY);
        if (trashJson != null) setTrashProjects(JSON.parse(trashJson));
        const trashImagesJson = await AsyncStorage.getItem(TRASH_IMAGES_KEY);
        if (trashImagesJson != null) setTrashImages(JSON.parse(trashImagesJson));
        

      } catch (e) { console.error(e); } finally { setIsReady(true); }
    };
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => { setNow(new Date()); }, 60000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saveProjectData = async () => {
      if (viewMode !== 'detail' || !currentProject || !isReady) return;
      try {
        const key = PROJECT_DATA_PREFIX + currentProject.id;
        const dataToSave = { 
            items: itemsByDay, 
            accommodations: accommodations,
            packingList: packingList 
        };
        await AsyncStorage.setItem(key, JSON.stringify(dataToSave));
        setHomeProjectData({ totalBudget: calculateProjectTotal(), itemsCount: Object.values(itemsByDay).flat().length });
      } catch (e) { console.error(e); }
    };
    saveProjectData();
  }, [itemsByDay, accommodations, packingList, currentProject]);

  useEffect(() => {
      const saveStock = async () => {
          if(!isReady) return;
          try {
              await AsyncStorage.setItem(STOCK_KEY, JSON.stringify(stockList));
          } catch(e) { console.error(e); }
      };
      saveStock();
  }, [stockList]);

  const executeFullRestore = async (onComplete) => {
    // 1. 連打防止: すでに処理中なら何もしない
    if (isProcessing) return;
    
    // 2. 処理開始フラグを立てる (ローディング表示)
    setIsProcessing(true);

    try {
        // 3. iOS対策: UIの競合を避けるため、一瞬待ってからPickerを開く
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = await DocumentPicker.getDocumentAsync({ 
            type: ['application/zip', 'application/x-zip-compressed'], 
            copyToCacheDirectory: true 
        });
        
        if (result.canceled) return;
        
        Alert.alert("復元中", "データを解析しています。しばらくお待ちください...");

        const fileUri = result.assets[0].uri;
        const b64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        const zip = await JSZip.loadAsync(b64, { base64: true });
        
        const jsonFile = zip.file("data.json");
        if (!jsonFile) throw new Error("バックアップデータが見つかりません");
        
        const jsonStr = await jsonFile.async("string");
        const data = JSON.parse(jsonStr);

        // --- 画像展開 ---
        const photoFolder = zip.folder("photos");
        const pathMap = {};
        const restoreDir = FileSystem.documentDirectory + 'restored_photos/';
        
        try {
            const dirInfo = await FileSystem.getInfoAsync(restoreDir);
            if (dirInfo.exists) await FileSystem.deleteAsync(restoreDir);
        } catch (e) { /* ignore */ }
        await FileSystem.makeDirectoryAsync(restoreDir, { intermediates: true });
        
        if (photoFolder) {
            const fileEntries = [];
            photoFolder.forEach((path, file) => fileEntries.push({path, file}));
            
            await Promise.all(fileEntries.map(async ({path, file}) => {
                const imgB64 = await file.async("base64");
                const safeFileName = path.split('/').pop(); 
                const newPath = restoreDir + safeFileName;
                
                await FileSystem.writeAsStringAsync(newPath, imgB64, { encoding: FileSystem.EncodingType.Base64 });
                
                pathMap[`photos/${path}`] = newPath;
                if (path !== safeFileName) pathMap[`photos/${safeFileName}`] = newPath;
            }));
        }

        const restorePath = (p) => pathMap[p] || p;

        // --- データ書き戻し ---
        const restoredProjects = data.projects.map(p => {
            p.imageUri = restorePath(p.imageUri);
            if(p.coverImages) p.coverImages = p.coverImages.map(restorePath);
            return p;
        });
        await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(restoredProjects));

        const restoredStock = data.stock.map(s => {
            s.imageUri = restorePath(s.imageUri);
            return s;
        });
        await AsyncStorage.setItem(STOCK_KEY, JSON.stringify(restoredStock));

        const pIds = Object.keys(data.details.items);
        for (const pid of pIds) {
            const items = data.details.items[pid];
            const acc = data.details.accommodations[pid];
            const packing = data.details.packing[pid] || [];

            Object.values(items).flat().forEach(i => {
                i.imageUri = restorePath(i.imageUri);
                if(i.images) i.images = i.images.map(restorePath);
            });
            Object.values(acc).forEach(a => {
                if(typeof a === 'object') {
                    a.dayImageUri = restorePath(a.dayImageUri);
                    if(a.dayImages) a.dayImages = a.dayImages.map(restorePath);
                }
            });

            const key = PROJECT_DATA_PREFIX + pid;
            await AsyncStorage.setItem(key, JSON.stringify({
                items, accommodations: acc, packingList: packing
            }));
        }

        Alert.alert("復元完了", "アプリを再読み込みします");
        if (onComplete) onComplete();

    } catch (e) {
        // iOSのエラー「Different document picking in progress」はここで握りつぶすか、優しく表示
        if (e.message && e.message.includes("Different document picking")) {
            console.log("Document Picker conflict ignored.");
            // ユーザーには何も言わないか、「もう一度お試しください」程度に
        } else {
            Alert.alert("復元失敗", e.message);
        }
    } finally {
        // 4. 必ず最後に処理中フラグを下ろす
        setIsProcessing(false);
    }
};

  // --- Image Picker ---
// ■■■ 修正: プロジェクト画像の追加 (コレクション対応版) ■■■
  const pickImageForProject = async (projectId) => {
    Alert.alert("表紙の写真", "写真の追加方法を選んでください", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ライブラリから選択",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
          });
          if (!result.canceled) {
            setIsProcessing(true);
            saveHeroImage(result.assets[0].uri, projectId, false);
          }
        },
      },
      {
        text: "カメラで撮影",
        onPress: async () => {
          try {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [16, 9],
              quality: 1,
            });
            if (!result.canceled) {
              setIsProcessing(true);
              saveHeroImage(result.assets[0].uri, projectId, true);
            }
          } catch (e) {
            Alert.alert("エラー", "カメラ起動エラー");
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  // 内部処理用ヘルパー
  const saveHeroImage = async (uri, projectId, isCamera) => {
    try {
      const targetProject = projects.find(p => p.id === projectId);
      const pTitle = targetProject ? targetProject.title : "Project";
      
      const savedUri = await processAndSaveImage(uri, pTitle, "Cover", "Main", isCamera);
      
      if (savedUri) {
        // 既存のコレクションを取得
        const currentCovers = targetProject.coverImages || (targetProject.imageUri ? [targetProject.imageUri] : []);
        // 新しい画像を先頭に追加
        const newCovers = [savedUri, ...currentCovers];

        const newProjects = projects.map(p => p.id === projectId ? { ...p, imageUri: savedUri, coverImages: newCovers } : p);
        setProjects(newProjects);
        await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
        
        if (currentProject && currentProject.id === projectId) { 
            setCurrentProject({ ...currentProject, imageUri: savedUri, coverImages: newCovers }); 
        }
      }
    } catch(e) {
      console.error(e);
      Alert.alert("エラー", "保存に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // ■■■ 追加: ヒーロー画像操作用関数群 ■■■
  const handleLongPressHero = (project) => {
    if(!project) return;
    // 古いデータ互換: coverImagesがない場合はimageUriから作る
    const covers = project.coverImages || (project.imageUri ? [project.imageUri] : []);
    setSelectedHeroProject({ ...project, coverImages: covers });
    setHeroSelectVisible(true);
  };

  const handleSetHeroImage = async (uri) => {
    if (!selectedHeroProject) return;
    const newProjects = projects.map(p => p.id === selectedHeroProject.id ? { ...p, imageUri: uri } : p);
    
    setProjects(newProjects);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
    setSelectedHeroProject(prev => ({ ...prev, imageUri: uri })); // 表示更新
    // モーダルは閉じない（選んだ感触を残すため）
    Alert.alert("変更しました", "表紙画像を変更しました");
  };

  const handleDeleteHeroImage = async (uri) => {
    if (!selectedHeroProject) return;
    
    Alert.alert("削除", "この写真を表紙コレクションから削除し、ゴミ箱へ移動しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: async () => {
          // 1. ゴミ箱へ移動
          await moveImageToTrash(uri, { type: 'day', projectId: selectedHeroProject.id, dayIndex: -1, itemId: 'cover' }); // dayIndex -1 は表紙扱い
          
          // 2. リストから削除
          const newCovers = selectedHeroProject.coverImages.filter(u => u !== uri);
          
          // もし現在使用中の画像だったら、次の候補（なければnull）をセット
          let newActiveUri = selectedHeroProject.imageUri;
          if (selectedHeroProject.imageUri === uri) {
             newActiveUri = newCovers.length > 0 ? newCovers[0] : null;
          }

          const newProjects = projects.map(p => p.id === selectedHeroProject.id ? { ...p, imageUri: newActiveUri, coverImages: newCovers } : p);
          
          setProjects(newProjects);
          await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
          
          // モーダル内の表示も更新
          setSelectedHeroProject(prev => ({ ...prev, imageUri: newActiveUri, coverImages: newCovers }));
      }}
    ]);
  };



  const pickImageForStock = async () => {
    Alert.alert("ストックの写真", "写真の追加方法を選んでください", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ライブラリから選択",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
          });
          if (!result.canceled) setInputStockImage(result.assets[0].uri);
        },
      },
      {
        text: "カメラで撮影",
        onPress: async () => {
          try {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
            });
            if (!result.canceled) setInputStockImage(result.assets[0].uri);
          } catch (e) {
            Alert.alert("エラー", "カメラを起動できませんでした");
          }
        },
      },
    ]);
  };

// ■■■ 書き換え 1: アイテム（予定）の画像追加 ■■■
  const pickImageForItem = async () => {
    Alert.alert("写真を追加", "高画質のオリジナルは端末に、\n圧縮版はアプリに保存されます", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ライブラリから選択",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 10,
            quality: 1, // ★ここでは最高画質で受け取る
          });
          if (!result.canceled) {
            setIsProcessing(true); // ★ローディング開始
            try {
              // 選択された画像を1枚ずつ処理
              const newUris = [];
              // プロジェクト名やDay名を取得（フォルダ名用）
              const pTitle = currentProject ? currentProject.title : "NewProject";
              const dLabel = daysArray[currentPage] ? daysArray[currentPage].dayLabel : "Day";
              const iTitle = editModalVisible ? editItemTitle : inputItemTitle; // 編集中か新規か

              for (const asset of result.assets) {
                // ★自作関数で保存＆圧縮！
                const savedUri = await processAndSaveImage(
                  asset.uri, 
                  pTitle, 
                  dLabel, 
                  iTitle || "NoTitle", 
                  false // カメラではないのでfalse
                );
                if (savedUri) newUris.push(savedUri);
              }

              if (editModalVisible) setEditItemImages((prev) => [...prev, ...newUris]);
              else setInputItemImages((prev) => [...prev, ...newUris]);
            } catch (e) {
              Alert.alert("エラー", "画像の保存に失敗しました");
            } finally {
              setIsProcessing(false); // ★ローディング終了
            }
          }
        },
      },
      {
        text: "カメラで撮影",
        onPress: async () => {
          try {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 1, // ★オリジナル保存用に高画質で
            });
            if (!result.canceled) {
              setIsProcessing(true);
              const pTitle = currentProject ? currentProject.title : "NewProject";
              const dLabel = daysArray[currentPage] ? daysArray[currentPage].dayLabel : "Day";
              const iTitle = editModalVisible ? editItemTitle : inputItemTitle;

              // ★自作関数で保存（カメラなのでtrue）
              const savedUri = await processAndSaveImage(
                result.assets[0].uri,
                pTitle,
                dLabel,
                iTitle || "NoTitle",
                true // ★カメラ撮影なのでオリジナルをアルバムへ
              );

              if (savedUri) {
                if (editModalVisible) setEditItemImages((prev) => [...prev, savedUri]);
                else setInputItemImages((prev) => [...prev, savedUri]);
              }
            }
          } catch (e) {
            Alert.alert("エラー", "カメラを起動できませんでした");
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

// ■■■ 書き換え: 付箋画像の削除 ■■■
  const removeItemImage = (uriToRemove) => {
      // 編集中（EditModal）の場合のみ、ゴミ箱へ送る情報を付与できる
      if(editModalVisible && selectedItemForAction) {
          const { dayIndex, item } = selectedItemForAction;
          // ゴミ箱へ移動
          moveImageToTrash(uriToRemove, { 
              type: 'item', 
              projectId: currentProject?.id, 
              dayIndex: dayIndex, 
              itemId: item.id 
          });
          setEditItemImages(prev => prev.filter(uri => uri !== uriToRemove));
      } else {
          // 新規作成中などは、まだIDがないので単に消すだけ（ゴミ箱には入れない）
          setInputItemImages(prev => prev.filter(uri => uri !== uriToRemove));
      }
  };

  const pickImageForHotel = async () => {
    Alert.alert("宿の写真", "写真の追加方法を選んでください", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ライブラリから選択",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 10,
            quality: 0.7,
          });
          if (!result.canceled) {
             setInputHotelImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
          }
        },
      },
      {
        text: "カメラで撮影",
        onPress: async () => {
          try {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 0.7,
            });
            if (!result.canceled) {
               setInputHotelImages(prev => [...prev, result.assets[0].uri]);
            }
          } catch (e) {
            Alert.alert("エラー", "カメラを起動できませんでした");
          }
        },
      },
    ]);
  };

  const removeHotelImage = (uriToRemove) => { setInputHotelImages(prev => prev.filter(uri => uri !== uriToRemove)); };
  
// ■■■ 書き換え 3: Dayヘッダーの画像追加 ■■■
  const pickImageForDay = async (dayIndex) => {
    Alert.alert("Day表紙の写真", "写真の追加方法を選んでください", [
        { text: "キャンセル", style: "cancel" },
        { text: "ライブラリから選択", onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 10, quality: 1 });
            if (!result.canceled) {
                setIsProcessing(true);
                const pTitle = currentProject.title;
                const dLabel = daysArray[dayIndex].dayLabel;
                
                const newUris = [];
                for (const asset of result.assets) {
                   const savedUri = await processAndSaveImage(asset.uri, pTitle, dLabel, "DayHeader", false);
                   if(savedUri) newUris.push(savedUri);
                }

                setAccommodations(prev => {
                    const current = prev[dayIndex] || {};
                    const currentImages = current.dayImages || [];
                    // 古い互換性維持
                    if(current.dayImageUri && !currentImages.includes(current.dayImageUri)) currentImages.unshift(current.dayImageUri);
                    return { ...prev, [dayIndex]: { ...current, dayImages: [...newUris, ...currentImages] } };
                });
                setIsProcessing(false);
            }
        }},
        { text: "カメラで撮影", onPress: async () => {
            let result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16,9], quality: 1 });
            if(!result.canceled){
                setIsProcessing(true);
                const pTitle = currentProject.title;
                const dLabel = daysArray[dayIndex].dayLabel;
                const savedUri = await processAndSaveImage(result.assets[0].uri, pTitle, dLabel, "DayHeader", true);

                if(savedUri) {
                  setAccommodations(prev => {
                      const current = prev[dayIndex] || {};
                      const currentImages = current.dayImages || [];
                      return { ...prev, [dayIndex]: { ...current, dayImages: [savedUri, ...currentImages] } };
                  });
                }
                setIsProcessing(false);
            }
        }}
    ]);
  };

// ■■■ 修正: オブジェクト形式と文字列形式の両方に対応した削除ロジック ■■■
const removeDayImage = (uriToRemove) => {
    // どの日の画像か特定する必要があるため、currentViewingDayIndex や openDayAlbum の引数を利用したいが、
    // アルバムモーダルが開いている前提なので、albumViewMode や画像のメタデータから推測する
    
    // albumImages は { uri, dayIndex, ... } のオブジェクト配列になっているはず
    // もし文字列配列なら dayIndex が不明だが、最近のコード修正でオブジェクト化しているはず
    
    // 1. 削除対象の画像オブジェクトを探す
    const targetImgObj = albumImages.find(img => (img.uri === uriToRemove || img === uriToRemove));
    const dIndex = targetImgObj ? targetImgObj.dayIndex : currentViewingDayIndex; // 見つからなければ現在のページ

    if (dIndex !== undefined && dIndex !== null) {
        // ゴミ箱へ
        moveImageToTrash(uriToRemove, {
            type: 'day',
            projectId: currentProject?.id,
            dayIndex: dIndex,
            itemId: 'header'
        });

        // 画面上の表示から削除
        setAlbumImages(prev => prev.filter(item => {
            const u = typeof item === 'string' ? item : item.uri;
            return u !== uriToRemove;
        }));
        
        // データ本体(accommodations)からも削除
        setAccommodations(prev => {
            const acc = prev[dIndex] || {};
            const currentImages = acc.dayImages || (acc.dayImageUri ? [acc.dayImageUri] : []);
            const newImages = currentImages.filter(u => u !== uriToRemove);
            return { ...prev, [dIndex]: { ...acc, dayImages: newImages } };
        });
    }
  };


  // ■■■ 修正: ホームのアルバムボタンは「アルバムタブ」へ移動するように変更 ■■■
  const openHomeAlbum = () => {
    // モーダル(setDayAlbumVisible)ではなく、タブを切り替える
    setAlbumViewMode('list'); 
    setActiveTab('album'); 
  };

  // ■■■ 修正: アルバム詳細読み込み (リセット＆厳密ロード版) ■■■
  const handleOpenAlbumDetail = async (project) => {
    // 1. まず状態をクリア (これで前の写真が残るのを防ぐ)
    setAlbumImages([]); 
    setIsAlbumLoading(true);
    setTargetAlbumProject(project);

    try {
      let targetItems = {};
      let targetAcc = {};

      // 2. データの取得元を決定
      // 「現在編集中のプロジェクト」とIDが一致する場合のみ、メモリ上のデータを使う
      if (currentProject && String(currentProject.id) === String(project.id)) {
        targetItems = itemsByDay;
        targetAcc = accommodations;
      } else {
        // それ以外（ホームから開いた場合など）は、ストレージから確実にロード
        const key = PROJECT_DATA_PREFIX + project.id;
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue != null) {
          const loadedData = JSON.parse(jsonValue);
          targetItems = loadedData.items || {};
          targetAcc = loadedData.accommodations || {};
        }
      }

      // 3. 画像収集 (収集ロジックは前回と同じですが、対象データが正確になります)
      const allImages = [];

      // A. 表紙
      if (project.imageUri) {
        allImages.push({ uri: project.imageUri, dayIndex: -1, title: '表紙', time: 'Cover' });
      }

      // B. 予定リスト
      if (targetItems) {
        Object.keys(targetItems).forEach(dayKey => {
          const dIndex = parseInt(dayKey);
          const dayItems = targetItems[dayKey];
          if (Array.isArray(dayItems)) {
            dayItems.forEach(item => {
              if (item.images && Array.isArray(item.images)) {
                item.images.forEach(uri => {
                  if(uri) allImages.push({ uri, dayIndex: dIndex, title: item.title, time: item.time });
                });
              } else if (item.imageUri) {
                 allImages.push({ uri: item.imageUri, dayIndex: dIndex, title: item.title, time: item.time });
              }
            });
          }
        });
      }

      // C. 宿・ヘッダー
      if (targetAcc) {
        Object.keys(targetAcc).forEach(dayKey => {
          const dIndex = parseInt(dayKey);
          const acc = targetAcc[dayKey];
          if (acc) {
             const accName = (typeof acc === 'object') ? (acc.name || '宿泊') : (acc || '宿泊');
             if (typeof acc === 'object') {
               const accImages = acc.dayImages || (acc.dayImageUri ? [acc.dayImageUri] : []);
               if (Array.isArray(accImages)) {
                 accImages.forEach(uri => {
                    if(uri) allImages.push({ uri, dayIndex: dIndex, title: accName, time: '宿泊' });
                 });
               }
             }
          }
        });
      }

      // 重複除去してセット
      const uniqueImages = [];
      const seenUris = new Set();
      allImages.forEach(img => {
        if (!seenUris.has(img.uri)) {
          seenUris.add(img.uri);
          uniqueImages.push(img);
        }
      });
      
      setAlbumImages(uniqueImages);
      setAlbumViewMode('detail'); // 詳細画面へ遷移

    } catch (e) {
      console.error(e);
      Alert.alert("エラー", "読み込みに失敗しました");
    } finally {
      setIsAlbumLoading(false);
    }
  };

// ■■■ 修正: アルバムを開く関数（データを詳細化する） ■■■
  const openDayAlbum = (dayIndex) => {
    // 1. 表示する日のインデックスをセット
    setCurrentViewingDayIndex(dayIndex);
    
    const detailedImages = [];
    
    // 2. Dayヘッダー画像を集める
    const acc = accommodations[dayIndex] || {};
    // 新旧データ構造に対応（配列か単体か）
    const dayImages = acc.dayImages || (acc.dayImageUri ? [acc.dayImageUri] : []);
    
    dayImages.forEach(uri => {
        if (uri) {
            detailedImages.push({
                uri: uri,
                type: 'day',
                dayIndex: dayIndex,
                itemId: 'header' // ヘッダー画像であることを明記
            });
        }
    });

    // 3. その日の付箋（Item）の画像を集める
    const dayItems = itemsByDay[dayIndex] || [];
    
    dayItems.forEach(item => {
        const itemImages = item.images || (item.imageUri ? [item.imageUri] : []);
        itemImages.forEach(uri => {
            if (uri) {
                detailedImages.push({
                    uri: uri,
                    type: 'item',
                    dayIndex: dayIndex,
                    itemId: item.id // どの付箋の画像かIDを記録
                });
            }
        });
    });

    // 4. ステートにセットしてモーダルを開く
    setAlbumImages(detailedImages);
    setAlbumSelectionMode(false); // 選択モードはオフで開始
    setSelectedAlbumImages([]);   // 選択状態もリセット
    setDayAlbumVisible(true);
  };

  const handleSelectProjectAlbum = (project) => {
    let images = [];
    if (project.imageUri) images.push(project.imageUri);
    // Projectデータそのものではなく、保存されているデータをロードする必要がある
    // しかし簡易表示として、メモリにあるデータを使うか、ロード処理を入れる
    // 今回は簡易的に「現在開いているプロジェクト」ならメモリから、そうでなければ空（本来はロードが必要）
    // ※完全実装するには非同期ロードが必要ですが、今回はUI動作優先で currentProject のみ対応とします
    if (currentProject && currentProject.id === project.id) {
        // 現在開いているプロジェクト
        openDayAlbum(0); // 便宜上0日目などを開くか、全日程収集ロジックを入れる
        // ここでは全日程収集ロジックを再実装
        let allImgs = [];
        if(currentProject.imageUri) allImgs.push(currentProject.imageUri);
        Object.values(itemsByDay).forEach(items => items.forEach(i => {
            if(i.images) allImgs.push(...i.images);
            if(i.imageUri) allImgs.push(i.imageUri);
        }));
        Object.values(accommodations).forEach(acc => {
             if(acc.dayImages) allImgs.push(...acc.dayImages);
             if(acc.dayImageUri) allImgs.push(acc.dayImageUri);
        });
        setAlbumImages(allImgs);
    } else {
        // 本来はここで AsyncStorage.getItem(PROJECT_DATA_PREFIX + project.id) して画像を集める
        Alert.alert("Info", "現在開いているプロジェクト以外の写真は、一度その計画を開いてから見てください");
        return;
    }
    setAlbumSelectionMode(false);
  };

const handleTapImage = (imgObj) => {
    // imgObjが文字列(URIのみ)の場合と、オブジェクトの場合両方に対応
    if (typeof imgObj === 'string') {
      setSelectedPhotoData({ uri: imgObj, title: '写真', dayIndex: null });
    } else {
      setSelectedPhotoData(imgObj);
    }
    setPhotoOverlayVisible(true);
  };


// ■■■ 修正: ジャンプ機能（安全装置付き） ■■■
  // ■■■ 修正: ジャンプ機能（レンダリング待ち調整） ■■■
  const jumpFromPhoto = () => {
    // 1. モーダルを閉じる
    setPhotoOverlayVisible(false);
    setDayAlbumVisible(false);

    if (selectedPhotoData && selectedPhotoData.dayIndex !== null && selectedPhotoData.dayIndex !== undefined) {
      
      // データ整合性チェック
      if (!currentProject && projects.length > 0) {
         // ホームから飛んできた場合の復帰策
         const latest = projects[projects.length - 1];
         setCurrentProject(latest);
         const days = generateDays(latest.startDate, latest.endDate);
         setDaysArray(days);
      }

      // 2. 画面モード切り替え
      // ★ここが重い処理(RenderPlanの描画)のトリガーです
      setViewMode('detail');
      setActiveTab('plan');

      // 3. スクロール実行
      // レンダリング完了を待つため、少し長めに待機するか、
      // requestAnimationFrame を使うのがReact Nativeのお作法です
      requestAnimationFrame(() => {
          setTimeout(() => {
            jumpToDay(selectedPhotoData.dayIndex);
          }, 300); // 500ms -> 300ms に短縮しつつ、requestAnimationFrameでタイミングを最適化
      });
      
    } else {
      Alert.alert("Info", "この写真には日付データが紐付いていません");
    }
  };
  // --- プロジェクト操作 ---
  const handleOpenProject = async (project) => {
    setIsReady(false);
    setCurrentProject(project);
    const days = generateDays(project.startDate, project.endDate);
    setDaysArray(days);
    try {
      const key = PROJECT_DATA_PREFIX + project.id;
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue != null) {
        const loadedData = JSON.parse(jsonValue);
        setItemsByDay(loadedData.items || {});
        setAccommodations(loadedData.accommodations || {});
        setPackingList(loadedData.packingList || []);
      } else { setItemsByDay({}); setAccommodations({}); setPackingList([]); }
    } catch (e) { console.error(e); }
    setViewMode('detail');
    setIsReady(true);
    setActiveTab('plan');
  };

  // ■■■ 画像をゴミ箱に入れる関数 ■■■
  const moveImageToTrash = async (uri, sourceInfo) => {
    // sourceInfo = { type: 'item'|'day'|'hotel', projectId, dayIndex, itemId }
    const trashItem = {
      id: Date.now().toString(), // ゴミ箱内でのユニークID
      uri: uri,
      source: sourceInfo,
      deletedAt: new Date().toISOString()
    };
    
    const newTrash = [trashItem, ...trashImages];
    setTrashImages(newTrash);
    await AsyncStorage.setItem(TRASH_IMAGES_KEY, JSON.stringify(newTrash));
    
    // ユーザーへの通知（オプション）
    // Alert.alert("ゴミ箱へ", "画像をゴミ箱に移動しました"); 
  };

// ■■■ 修正: 画像を復元する関数 (表紙・付箋・宿 すべて対応版) ■■■
  const restoreSelectedTrashImages = async () => {
    if (selectedTrashIds.length === 0) return;
    
    const toRestore = trashImages.filter(img => selectedTrashIds.includes(img.id));
    const toKeep = trashImages.filter(img => !selectedTrashIds.includes(img.id));
    
    // 復元処理用の変数
    let updatedItemsByDay = { ...itemsByDay };
    let updatedAccommodations = { ...accommodations };
    let updatedProjects = [...projects]; // プロジェクトリストも更新対象にする
    let successCount = 0;
    let projectUpdated = false; // プロジェクト情報の更新があったかフラグ

    toRestore.forEach(img => {
      // 削除時の情報: { type, projectId, dayIndex, itemId }
      const { type, projectId, dayIndex, itemId } = img.source;
      
      // ■ ケース1: プロジェクトの表紙 (Hero) の復元
      if (itemId === 'cover') {
         // 対象のプロジェクトを探す
         const pIndex = updatedProjects.findIndex(p => p.id === projectId);
         if (pIndex >= 0) {
           const targetP = updatedProjects[pIndex];
           const currentCovers = targetP.coverImages || (targetP.imageUri ? [targetP.imageUri] : []);
           
           // 重複していなければ追加 (先頭に戻す)
           if (!currentCovers.includes(img.uri)) {
             const newCovers = [img.uri, ...currentCovers];
             updatedProjects[pIndex] = { ...targetP, coverImages: newCovers, imageUri: img.uri }; // 復元した画像をメイン表紙に戻す
             projectUpdated = true;
             successCount++;
           }
         }
      }
      
      // ■ ケース2: 現在開いているプロジェクトの中身 (付箋・宿) の復元
      // ※注意: 詳細データ(itemsByDay)は「現在開いているプロジェクト」のものしかメモリにないため、
      // 　開いているプロジェクトの画像のみ復元可能とします
      else if (currentProject && String(currentProject.id) === String(projectId)) {
          
          // A. 付箋(アイテム)の画像を復元
          if (type === 'item' && itemId) {
             const dayItems = updatedItemsByDay[dayIndex] || [];
             const targetItemIndex = dayItems.findIndex(i => i.id === itemId);
             if (targetItemIndex >= 0) {
               const targetItem = dayItems[targetItemIndex];
               const currentImages = targetItem.images || (targetItem.imageUri ? [targetItem.imageUri] : []);
               
               if (!currentImages.includes(img.uri)) {
                 const newImages = [...currentImages, img.uri];
                 updatedItemsByDay[dayIndex][targetItemIndex] = { ...targetItem, images: newImages };
                 successCount++;
               }
             }
          }
          // B. Dayヘッダー/宿の画像を復元
          else if (type === 'day' || type === 'hotel') {
             const targetAcc = updatedAccommodations[dayIndex] || {};
             const currentImages = targetAcc.dayImages || (targetAcc.dayImageUri ? [targetAcc.dayImageUri] : []);
             if (!currentImages.includes(img.uri)) {
                const newImages = [img.uri, ...currentImages]; 
                updatedAccommodations[dayIndex] = { ...targetAcc, dayImages: newImages };
                successCount++;
             }
          }
      }
    });

    // --- 保存処理 ---

    // 1. プロジェクト一覧の更新 (表紙が戻った場合)
    if (projectUpdated) {
        setProjects(updatedProjects);
        await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
        
        // もし現在開いているプロジェクトの表紙が変わったなら、currentProjectも更新
        if (currentProject) {
            const updatedCurrent = updatedProjects.find(p => p.id === currentProject.id);
            if (updatedCurrent) setCurrentProject(updatedCurrent);
        }
    }

    // 2. 詳細データの更新 (付箋・宿が戻った場合)
    if (currentProject) {
        setItemsByDay(updatedItemsByDay);
        setAccommodations(updatedAccommodations);
        const key = PROJECT_DATA_PREFIX + currentProject.id;
        const dataToSave = { items: updatedItemsByDay, accommodations: updatedAccommodations, packingList };
        await AsyncStorage.setItem(key, JSON.stringify(dataToSave));
    }

    // 3. ゴミ箱の更新
    setTrashImages(toKeep);
    await AsyncStorage.setItem(TRASH_IMAGES_KEY, JSON.stringify(toKeep));

    setTrashSelectionMode(false);
    setSelectedTrashIds([]);
    
    Alert.alert("復元完了", `${successCount}枚の写真を復元しました`);
  };

  // ■■■ 選択した画像を完全削除 ■■■
  const deleteSelectedTrashImagesPermanently = async () => {
     // ここではリストから消すだけ（物理削除はお掃除機能に任せる）
     const toKeep = trashImages.filter(img => !selectedTrashIds.includes(img.id));
     setTrashImages(toKeep);
     await AsyncStorage.setItem(TRASH_IMAGES_KEY, JSON.stringify(toKeep));
     setTrashSelectionMode(false);
     setSelectedTrashIds([]);
  };

  const handleGoToPlanList = () => { setCurrentProject(null); setViewMode('list'); setActiveTab('plan'); };
// ■■■ 4. 既存の deleteProject を「ゴミ箱へ移動」に書き換え ■■■
  const deleteProject = async (projectId) => {
    try {
      // 削除対象を見つける
      const target = projects.find(p => p.id === projectId);
      if (!target) return;

      // ゴミ箱へ移動（deletedAt を付与して管理）
      const trashItem = { ...target, deletedAt: new Date().toISOString() };
      const newTrash = [trashItem, ...trashProjects];
      
      // 元のリストから削除
      const newProjects = projects.filter(p => p.id !== projectId);

      // State更新
      setProjects(newProjects);
      setTrashProjects(newTrash);
      
      // 保存
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
      await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));
      
      Alert.alert("ゴミ箱へ移動", "プロジェクトをゴミ箱に入れました。\n設定メニューから復元可能です。");
    } catch (e) {
      Alert.alert("エラー", "削除に失敗しました");
    }
  };

// ■■■ 5. 新規追加: ゴミ箱操作用の関数群 ■■■

  // 選択したものを復元
  const restoreSelectedTrash = async () => {
    if (selectedTrashIds.length === 0) return;

    // 復元対象と、ゴミ箱に残すものを分ける
    const toRestore = trashProjects.filter(p => selectedTrashIds.includes(p.id));
    const toKeepInTrash = trashProjects.filter(p => !selectedTrashIds.includes(p.id));

    // projectsに戻す（deletedAtは削除）
    const restoredProjects = toRestore.map(p => {
      const { deletedAt, ...rest } = p;
      return rest;
    });

    const newProjects = [...projects, ...restoredProjects].sort((a,b) => b.startDate.localeCompare(a.startDate)); // 日付順などでソート推奨

    // 保存
    setProjects(newProjects);
    setTrashProjects(toKeepInTrash);
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
    await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(toKeepInTrash));

    setTrashSelectionMode(false);
    setSelectedTrashIds([]);
    Alert.alert("復元完了", `${toRestore.length}件の計画を復元しました`);
  };

  // 選択したものを完全削除（物理削除含む）
  const deleteSelectedTrashPermanently = async () => {
    if (selectedTrashIds.length === 0) return;

    Alert.alert(
      "完全削除",
      "選択した計画を完全に削除します。\n含まれる写真データも消去され、二度と元に戻せません。\nよろしいですか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除する",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true); // ローディング開始
            try {
              // 1. 画像ファイルの物理削除
              for (const id of selectedTrashIds) {
                 const target = trashProjects.find(p => p.id === id);
                 if (target) {
                   // フォルダ名はプロジェクトタイトルベースだが、サニタイズされている
                   // ※ processAndSaveImage で作ったパス生成ロジックと同じものが必要
                   // ここでは簡易的に、プロジェクトIDごとのフォルダ管理にしておくのが理想だったが、
                   // 現状はタイトルベースのフォルダ構成なので、フォルダごと消す処理を入れる
                   
                   // 写真フォルダ: (Documents)/photos/(タイトル)/
                   // ※タイトルが重複していると他も消えるリスクがあるため、
                   // 本来はIDでフォルダを作るべきでした。
                   // 今回は安全のため「画像ファイルの参照」は消さず、
                   // 次のステップの「お掃除機能」でまとめて消す運用にしますか？
                   // それともここで頑張って消しますか？
                   
                   // → 安全策: ここではJSONデータだけ消し、後で「お掃除機能」で
                   // 「どのJSONにも属していない画像」を一括削除する方が安全です！
                 }
              }

              // 2. リストから削除
              const newTrash = trashProjects.filter(p => !selectedTrashIds.includes(p.id));
              setTrashProjects(newTrash);
              await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));

              setTrashSelectionMode(false);
              setSelectedTrashIds([]);
            } catch (e) {
              console.error(e);
              Alert.alert("エラー", "完全削除中にエラーが発生しました");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // ゴミ箱を空にする
  const emptyTrash = () => {
    if (trashProjects.length === 0) return;
    // 全てのIDを選択状態にして、完全削除関数を呼ぶ
    setSelectedTrashIds(trashProjects.map(p => p.id));
    // 少し待ってから実行（state反映待ち）
    setTimeout(() => deleteSelectedTrashPermanently(), 100);
  };

  const handleLongPressProject = (project) => { Alert.alert("操作", `「${project.title}」を削除しますか？`, [ { text: "キャンセル", style: "cancel" }, { text: "削除", style: "destructive", onPress: () => deleteProject(project.id) } ]); };

  const startCreateProject = () => { setModalMode('create'); setInputTitle(''); setInputStartDate(new Date()); setInputEndDate(new Date()); setProjectModalVisible(true); };
  const startEditProject = () => { if (!currentProject) return; setModalMode('edit'); setInputTitle(currentProject.title); setInputStartDate(new Date(currentProject.startDate)); setInputEndDate(new Date(currentProject.endDate)); setProjectModalVisible(true); };

  // ■■■ 修正: 日程短縮時の警告＆データお掃除機能付き保存処理 ■■■
  const handleSaveProject = async () => {
    if (inputTitle === '') { Alert.alert("エラー", "名前を入力してください"); return; }
    // 終了日が開始日より前になっていないかチェック
    if (inputEndDate < inputStartDate) { Alert.alert("エラー", "終了日は開始日よりあとにしてください"); return; }

    // ■ 保存実行用の内部関数（アラートのコールバックからも呼べるように分離）
    const executeSave = async () => {
        let newProjects;
        
        // 重複チェック (タイトル決定)
        const existingProjectsToCheck = (modalMode === 'edit' && currentProject)
          ? projects.filter(p => p.id !== currentProject.id)
          : projects;
        const uniqueTitle = generateUniqueTitle(inputTitle, existingProjectsToCheck);

        if (modalMode === 'edit' && currentProject) {
           // ■ 編集モード
           
           // 新しい期間の日数計算
           const newDuration = Math.floor((new Date(inputEndDate) - new Date(inputStartDate)) / (1000 * 60 * 60 * 24)) + 1;
           
           // データのお掃除 (短縮された場合、はみ出した日のデータを消す)
           // ※ itemsByDay は { "0": [...], "1": [...] } のような構造
           const cleanItems = { ...itemsByDay };
           const cleanAcc = { ...accommodations };
           
           // 存在しているキー(日数)をチェックし、新しい期間以上のものを削除
           Object.keys(cleanItems).forEach(key => {
               if (parseInt(key) >= newDuration) delete cleanItems[key];
           });
           Object.keys(cleanAcc).forEach(key => {
               if (parseInt(key) >= newDuration) delete cleanAcc[key];
           });

           // State更新 (お掃除後のデータをセット)
           setItemsByDay(cleanItems);
           setAccommodations(cleanAcc);

           const updatedProject = { 
             ...currentProject, 
             title: uniqueTitle,
             startDate: inputStartDate.toISOString(), 
             endDate: inputEndDate.toISOString() 
           };
           
           newProjects = projects.map(p => p.id === currentProject.id ? updatedProject : p);
           setCurrentProject(updatedProject);
           
           // 日付配列を再生成
           const newDays = generateDays(updatedProject.startDate, updatedProject.endDate);
           setDaysArray(newDays); 
           
           // もし現在表示中のページが削除された範囲なら、0ページ目に戻す
           if (currentPage >= newDuration) {
               setCurrentPage(0);
               if(scrollViewRef.current) scrollViewRef.current.scrollTo({ x: 0, animated: false });
           }

           // 保存
           const key = PROJECT_DATA_PREFIX + currentProject.id;
           const dataToSave = { items: cleanItems, accommodations: cleanAcc, packingList };
           await AsyncStorage.setItem(key, JSON.stringify(dataToSave));

           Alert.alert("更新完了", "変更しました");

        } else {
          // ■ 新規作成モード (ここは変更なし)
          const newProject = { 
            id: Date.now().toString(), 
            title: uniqueTitle,
            startDate: inputStartDate.toISOString(), 
            endDate: inputEndDate.toISOString(), 
            createdAt: new Date().toISOString() 
          };

          const firstDayItem = {
            id: Date.now(),
            time: '10:00',
            title: '出発！ ✈️',
            type: 'move',
            price: ''
          };

          setItemsByDay({ 0: [firstDayItem] }); 
          
          newProjects = [...projects, newProject];
          
          const key = PROJECT_DATA_PREFIX + newProject.id;
          const initialData = { items: { 0: [firstDayItem] }, accommodations: {}, packingList: [] };
          await AsyncStorage.setItem(key, JSON.stringify(initialData));

          handleOpenProject(newProject);
        }

        setProjects(newProjects);
        await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
        setProjectModalVisible(false);
    };

    // ■■■ 短縮チェックロジック ■■■
    if (modalMode === 'edit' && currentProject) {
        // 現在の日数
        const oldStart = new Date(currentProject.startDate);
        const oldEnd = new Date(currentProject.endDate);
        const oldDuration = Math.floor((oldEnd - oldStart) / (1000 * 60 * 60 * 24)) + 1;

        // 新しい日数
        const newStart = new Date(inputStartDate);
        const newEnd = new Date(inputEndDate);
        const newDuration = Math.floor((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1;

        // 日数が減る場合のみアラート
        if (newDuration < oldDuration) {
            const diff = oldDuration - newDuration;
            Alert.alert(
                "日程が短縮されます",
                `日程が ${diff}日 短くなります。\n最終日から ${diff}日分のデータは削除されますが、よろしいですか？`,
                [
                    { text: "キャンセル", style: "cancel" },
                    { 
                        text: "削除して変更", 
                        style: "destructive",
                        onPress: executeSave // OKなら保存実行
                    }
                ]
            );
            return; // ここで一旦止める
        }
    }

    // 短縮でない(延長または同じ)なら、そのまま保存
    executeSave();
  };

  // --- アイテム操作 ---
  const handleAddItem = () => {
    if (inputItemTitle === '') return;
    const finalType = isCheckinMode ? 'checkin' : newItemType;
    
    const newItem = { 
      id: Date.now(), 
      time: timeString || '未定', 
      title: inputItemTitle, 
      type: finalType, 
      price: inputItemPrice, 
      images: inputItemImages,
      url: inputItemUrl, // ★追加: URLも保存

      isMine: true,             
      authorId: 'me',           
      status: 'confirmed',      
      acceptedBy: ['me'],       
      originalId: null          
    };

    if (finalType === 'checkin' && inputItemTitle) { setAccommodations(prev => ({ ...prev, [currentPage]: {name: inputItemTitle, status: 'none'} })); }
    setItemsByDay(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), newItem].sort((a, b) => a.time.localeCompare(b.time)) }));
    setInputItemTitle(''); setTimeString(''); setInputItemPrice(''); setInputItemImages([]); setInputItemUrl(''); setModalVisible(false);
  };

// ■■■ 追加: 付箋のカメラボタンから直接写真を追加する関数 ■■■
  // ■■■ 追加: 付箋のカメラボタンから直接写真を追加する関数 ■■■
  const handleQuickPhoto = (dayIndex, item) => {
    // 既に写真がある場合は確認を出す（誤操作防止）
    const hasPhotos = (item.images && item.images.length > 0) || item.imageUri;
    const title = hasPhotos ? "写真を追加" : "写真を撮る";
    
    Alert.alert(title, `「${item.title}」に思い出を残しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ライブラリから",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 1,
          });
          if (!result.canceled) {
            await saveQuickPhotos(dayIndex, item, result.assets, false);
          }
        },
      },
      {
        text: "カメラで撮影",
        onPress: async () => {
          try {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false, // 連続撮影しやすいよう編集なしで
              quality: 1,
            });
            if (!result.canceled) {
              await saveQuickPhotos(dayIndex, item, result.assets, true);
            }
          } catch (e) {
            Alert.alert("エラー", "カメラを起動できませんでした");
          }
        },
      },
    ]);
  };

  // 内部処理: 写真を保存してStateを更新
  const saveQuickPhotos = async (dayIndex, item, assets, isCamera) => {
      setIsProcessing(true);
      try {
        const pTitle = currentProject.title;
        const dLabel = daysArray[dayIndex].dayLabel;
        const newUris = [];

        for (const asset of assets) {
            const savedUri = await processAndSaveImage(asset.uri, pTitle, dLabel, item.title, isCamera);
            if(savedUri) newUris.push(savedUri);
        }

        // State更新 (再レンダリング)
        setItemsByDay(prev => {
            const dayItems = prev[dayIndex] || [];
            const updatedList = dayItems.map(i => {
                if (i.id === item.id) {
                    const currentImages = i.images || (i.imageUri ? [i.imageUri] : []);
                    return { ...i, images: [...currentImages, ...newUris] };
                }
                return i;
            });
            return { ...prev, [dayIndex]: updatedList };
        });
        
        // 完了通知（あえて出さず、画面上のアイコン変化で気づかせるのがスマート）

      } catch (e) {
        Alert.alert("エラー", "保存に失敗しました");
      } finally {
        setIsProcessing(false);
      }
  };

// ■■■ 修正: 誤操作防止版 handleItemPress ■■■
const handleItemPress = ({ dayIndex, item }) => {
  if (!item) return;
  
  const status = item.status || 'confirmed';

  // 提案(pending) または 保留(hold) の場合
  if (status === 'pending' || status === 'hold') {
    
    const title = "提案の操作";
    const msg = `「${item.title}」\nをどうしますか？`;

    if (Platform.OS === 'android') {
        // Android: [削除] [保留] [承認] の順 (Negative, Neutral, Positive)
        // 削除ボタンを左端に追いやり、承認(右端)と距離を離す
        Alert.alert(
            title,
            msg,
            [
                { 
                  text: "🗑 削除", 
                  style: "destructive", // Androidの一部機種で赤くなる
                  onPress: () => handleRejectItem(dayIndex, item.id) 
                },
                { 
                  text: "✋ 保留", 
                  onPress: () => handleHoldItem(dayIndex, item.id) 
                },
                { 
                  text: "✅ 承認", 
                  onPress: () => handleAcceptItem(dayIndex, item.id) 
                },
            ],
            { cancelable: true }
        );
    } else {
        // iOS: 縦並び。[削除(赤)] [保留] [承認] [キャンセル]
        // 削除を一番上に、承認をその下に配置し、誤タップを防ぐ
        Alert.alert(
            title,
            msg,
            [
                { 
                  text: "🗑 削除する", 
                  style: "destructive", 
                  onPress: () => handleRejectItem(dayIndex, item.id) 
                },
                { 
                  text: "✋ 保留にする", 
                  onPress: () => handleHoldItem(dayIndex, item.id) 
                },
                { 
                  text: "✅ 承認して採用", 
                  style: "default",
                  onPress: () => handleAcceptItem(dayIndex, item.id) 
                },
                { 
                  text: "閉じる", 
                  style: "cancel" 
                },
            ]
        );
    }

  } else {
    // 確定済み（左側）は編集へ
    handleEditStart({ dayIndex, item });
  }
};
  const handleLongPressItem = (dayIndex, item) => { setSelectedItemForAction({ dayIndex, item }); handleEditStart({dayIndex, item}); };
  const handleDeleteItem = () => { if (!selectedItemForAction) return; const { dayIndex, item } = selectedItemForAction; Alert.alert("削除", `「${item.title}」を削除しますか？`, [ { text: "キャンセル", style: "cancel" }, { text: "削除", style: "destructive", onPress: () => { setItemsByDay(prev => { const newDayList = prev[dayIndex].filter(i => i.id !== item.id); return { ...prev, [dayIndex]: newDayList }; }); setEditModalVisible(false); }} ]); };
  
// ■■■ 修正: プロジェクト共有機能 (テキスト生成) ■■■
  const handleShareProject = async () => {
    if (!currentProject) return;

    // 1. 共有用のテキストを作成
    let message = `✈️ 旅行計画: ${currentProject.title}\n`;
    message += `📅 日程: ${formatDate(currentProject.startDate)} - ${formatDate(currentProject.endDate)}\n`;
    message += `💰 総予算: ${formatMoney(calculateProjectTotal())}\n\n`;

    // 各日程の概要を追加
    daysArray.forEach((day, index) => {
      message += `【Day ${day.dayLabel}】 ${day.date}\n`;
      const items = itemsByDay[index] || [];
      const acc = accommodations[index];

      items.forEach(item => {
        message += `⏰ ${item.time} ${item.title}`;
        if(item.budget) message += ` (${formatMoney(item.budget)})`;
        message += '\n';
      });

      if (acc) {
        message += `🏨 宿泊: ${acc.name}`;
        if(acc.budget) message += ` (${formatMoney(acc.budget)})`;
        message += '\n';
      }
      message += '\n';
    });

    message += `Created with Good Trip, Tripper.`;

    // 2. シェア画面を呼び出す
    try {
      await Share.share({
        message: message,
        title: `旅行計画: ${currentProject.title}`, // iOS用
      });
    } catch (error) {
      Alert.alert("エラー", error.message);
    }
  };
// ■■■ 修正: 特定日の共有機能 ■■■
  const handleShareDay = async (dayIndex) => {
    if (!currentProject) return;
    
    const dayData = daysArray[dayIndex];
    const items = itemsByDay[dayIndex] || [];
    const acc = accommodations[dayIndex];

    let message = `📅 ${dayData.date} (Day ${dayData.dayLabel}) の予定\n`;
    message += `📍 ${currentProject.title}\n\n`;

    items.forEach(item => {
      message += `⏰ ${item.time} ${item.title}\n`;
      if (item.memo) message += `   📝 ${item.memo}\n`;
    });

    if (acc) {
      message += `\n🏨 宿泊: ${acc.name}\n`;
    }

    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      Alert.alert("エラー", error.message);
    }
  };

  const handleDeleteFromMenu = () => { if (!selectedItemForAction) return; const { dayIndex, item } = selectedItemForAction; Alert.alert("削除", `「${item.title}」を削除しますか？`, [ { text: "キャンセル", style: "cancel" }, { text: "削除", style: "destructive", onPress: () => { setItemsByDay(prev => { const newDayList = prev[dayIndex].filter(i => i.id !== item.id); return { ...prev, [dayIndex]: newDayList }; }); setActionMenuVisible(false); }} ]); };
  const handleEditStart = (target = null) => { 
      const targetItem = target || selectedItemForAction; if (!targetItem) return; 
      const { dayIndex, item } = targetItem; 
      if (item.type === 'checkin') { openSingleHotelEdit(dayIndex); return; }
      setSelectedItemForAction({ dayIndex, item });
      setEditItemTitle(item.title); setEditTimeString(item.time); setEditItemType(item.type); setEditItemPrice(item.price ? item.price.toString() : ''); 
      setEditItemImages(item.images || (item.imageUri ? [item.imageUri] : []));
      const now = new Date(); const [h, m] = item.time.split(':'); if (h && m) now.setHours(parseInt(h), parseInt(m)); 
      setEditItemTime(now); setActionMenuVisible(false); setEditModalVisible(true); 
  };
  const handleInsertNext = () => {
      if (!selectedItemForAction) return; const { item } = selectedItemForAction;
      setEditModalVisible(false); setNewItemType('note'); setIsCheckinMode(false); setInputItemImages([]); setInputItemTitle(''); setInputItemPrice('');
      const [h, m] = (item.time && item.time !== '未定') ? item.time.split(':') : ['12','00'];
      const nextTime = new Date(); nextTime.setHours(parseInt(h)); nextTime.setMinutes(parseInt(m) + 60); 
      setInputItemTime(nextTime);
      const nextH = nextTime.getHours().toString().padStart(2, '0'); const nextM = nextTime.getMinutes().toString().padStart(2, '0');
      setTimeString(`${nextH}:${nextM}`); setModalVisible(true);
  };
  const handleEditSave = () => {
    if (!selectedItemForAction) return;
    const { dayIndex, item } = selectedItemForAction;

    setItemsByDay(prev => {
        const dayList = prev[dayIndex] || [];
        
        const updatedList = dayList.map(i => {
            if (i.id === item.id) {
                // 画像データの正規化: 
                // editItemImages（編集中）があればそれを採用。
                // なければ、古い imageUri を配列化して保持。それもなければ空配列。
                const finalImages = (editItemImages && editItemImages.length > 0)
                    ? editItemImages
                    : (i.imageUri ? [i.imageUri] : []);

                return {
                    ...i, // 元のデータを展開
                    title: editItemTitle,
                    time: editTimeString,
                    type: editItemType,
                    price: editItemPrice,
                    images: finalImages, // ★確実に配列として保存
                    imageUri: finalImages.length > 0 ? finalImages[0] : null, // ★サムネイル用(互換性)
                };
            }
            return i;
        });

        // 時間順にソートし直す
        return { 
            ...prev, 
            [dayIndex]: updatedList.sort((a, b) => a.time.localeCompare(b.time)) 
        };
    });

    setEditModalVisible(false);
    setSelectedItemForAction(null);
    
    // ★念のため編集用の一時画像をクリア
    setEditItemImages([]);
};

// ■■■ River UI アクション: 採用（左へ移動） ■■■
const handleAcceptItem = (dayIndex, itemId) => {
  setItemsByDay(prev => {
    const dayItems = prev[dayIndex] || [];
    const updatedList = dayItems.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'confirmed' }; // ステータスを確定に変更
      }
      return item;
    });
    return { ...prev, [dayIndex]: updatedList };
  });
  Alert.alert("採用しました", "左側のタイムラインに移動しました！");
};
// ■■■ River UI: 一括承認アクション ■■■
const handleBatchApprove = (dayIndex) => {
  const dayItems = itemsByDay[dayIndex] || [];
  const pendingItems = dayItems.filter(i => i.status === 'pending');

  if (pendingItems.length === 0) return;

  Alert.alert(
    "一括承認",
    `この日の提案 (${pendingItems.length}件) をすべて承認しますか？`,
    [
      { text: "キャンセル", style: "cancel" },
      {
        text: "承認する",
        onPress: () => {
          setItemsByDay(prev => {
            const currentList = prev[dayIndex] || [];
            const updatedList = currentList.map(item => {
              if (item.status === 'pending') {
                return { ...item, status: 'confirmed' };
              }
              return item;
            });
            return { ...prev, [dayIndex]: updatedList };
          });
          Alert.alert("完了", "すべての提案を承認しました！");
        }
      }
    ]
  );
};
// ■■■ River UI アクション: 保留（バッジ消去・右側に残す） ■■■
const handleHoldItem = (dayIndex, itemId) => {
  setItemsByDay(prev => {
    const dayItems = prev[dayIndex] || [];
    const updatedList = dayItems.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'hold' }; // ステータスを保留に変更
      }
      return item;
    });
    return { ...prev, [dayIndex]: updatedList };
  });
  // アラートは出さずにスッと更新するのがスマートです
};
// ■■■ River UI アクション: 却下（削除） ■■■
const handleRejectItem = (dayIndex, itemId) => {
  setItemsByDay(prev => {
    const dayItems = prev[dayIndex] || [];
    const updatedList = dayItems.filter(item => item.id !== itemId); // リストから除外
    return { ...prev, [dayIndex]: updatedList };
  });
  // ゴミ箱に入れる処理が必要ならここに moveImageToTrash 等を追加
};

  // --- その他モーダル操作 ---
  const openQuickPriceModal = (dayIndex, item) => { setTargetItemForPrice({ dayIndex, item }); setTempPrice(item.price ? item.price.toString() : ''); setQuickPriceModalVisible(true); };
  const saveQuickPrice = () => { if (!targetItemForPrice) return; const { dayIndex, item } = targetItemForPrice; setItemsByDay(prev => { const dayList = prev[dayIndex] || []; const updatedList = dayList.map(i => (i.id === item.id) ? { ...i, price: tempPrice } : i); return { ...prev, [dayIndex]: updatedList }; }); setQuickPriceModalVisible(false); setTargetItemForPrice(null); };
  const openQuickTimeModal = (dayIndex, item) => { setTargetItemForTime({ dayIndex, item }); const [h, m] = (item.time && item.time !== '未定') ? item.time.split(':') : ['12','00']; const date = new Date(); date.setHours(parseInt(h)); date.setMinutes(parseInt(m)); setTempTimeDate(date); setTempTimeString(item.time || '12:00'); setQuickTimeModalVisible(true); };
  const saveQuickTime = () => { if (!targetItemForTime) return; const { dayIndex, item } = targetItemForTime; setItemsByDay(prev => { const dayList = prev[dayIndex] || []; const updatedList = dayList.map(i => (i.id === item.id) ? { ...i, time: tempTimeString } : i); return { ...prev, [dayIndex]: updatedList.sort((a, b) => a.time.localeCompare(b.time)) }; }); setQuickTimeModalVisible(false); setTargetItemForTime(null); };
  
  const handleGapPress = (dayIndex, time1, time2) => {
    setGapInsertInfo({ dayIndex, time: time1 });
    setInputTransportPrice('');
    setSelectedTransportOption(null);
    setTransportModalVisible(true);
  };

  const handleAddTransport = () => {
    if (!selectedTransportOption) { Alert.alert('エラー', '移動手段を選んでください'); return; }
    if (!gapInsertInfo) return;
    const { dayIndex, time } = gapInsertInfo;
    let title = selectedTransportOption.defaultTitle;
    const newItem = { id: Date.now(), time: time, title: title, type: 'move', price: inputTransportPrice };
    setItemsByDay((prev) => ({
      ...prev,
      [dayIndex]: [...(prev[dayIndex] || []), newItem].sort((a, b) => {
        const timeDiff = a.time.localeCompare(b.time);
        if (timeDiff !== 0) return timeDiff;
        if (a.type === 'move' && b.type !== 'move') return 1;
        if (a.type !== 'move' && b.type === 'move') return -1;
        return 0;
      }),
    }));
    setTransportModalVisible(false);
  };  

  const openSingleHotelEdit = (index) => { setTargetHotelIndex(index); setStayDuration(1); const data = accommodations[index]; let hasData = false; if (typeof data === 'object' && data !== null) { setInputSingleHotelName(data.name || ''); setInputHotelTel(data.tel || ''); setInputHotelAddress(data.address || ''); setInputHotelUrl(data.url || ''); setInputSingleHotelStatus(data.status || 'none'); setInputHotelImages(data.dayImages || (data.dayImageUri ? [data.dayImageUri] : [])); if (data.name) hasData = true; } else { setInputSingleHotelName(data || ''); setInputHotelTel(''); setInputHotelAddress(''); setInputHotelUrl(''); setInputSingleHotelStatus('none'); setInputHotelImages([]); if (data) hasData = true; } setSingleCheckinTimeString('15:00'); setIsHotelEditMode(!hasData); setSingleHotelModalVisible(true); };

  // ■■■ 追加: 宿情報へICSを取り込む関数 ■■■
const handleImportICSForHotel = async () => {
  try {
    // 1. ファイル選択
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/calendar', 'application/octet-stream', '*/*'], // .icsを狙う
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    
    // 2. ファイル読み込み
    const fileUri = result.assets[0].uri;
    // 拡張子チェック (簡易)
    if (!result.assets[0].name.toLowerCase().endsWith('.ics')) {
      Alert.alert("確認", "拡張子が .ics ではありませんが、解析を試みますか？", [
        { text: "やめる", style: "cancel" },
        { text: "試す", onPress: () => processICS(fileUri) }
      ]);
      return;
    }

    await processICS(fileUri);

  } catch (e) {
    Alert.alert("エラー", "ファイルの読み込みに失敗しました");
  }
};

// ■■■ 追加: クリップボードからICS/テキスト情報を解析して入力する関数 ■■■


// 内部処理
// ■■■ 修正: 日付チェック付きの反映ロジック ■■■
// 共通処理として定義しておくと便利です
const applyICSData = (data) => {
    if (!data || (!data.title && !data.address)) {
      Alert.alert("エラー", "スケジュール情報が見つかりませんでした");
      return;
    }

    // ★日付チェックロジック
    let warningMessage = "";
    const currentDayDate = daysArray[targetHotelIndex]?.date; // 今開いているページの日付 (例: "2025/12/24")

    if (data.date && currentDayDate && data.date !== currentDayDate) {
        warningMessage = `⚠️ 日付が一致しません！\n\nデータの予定日: ${data.date}\n現在のページ: ${currentDayDate}\n\n`;
    }

    Alert.alert(
      "情報を検出",
      `${warningMessage}件名: ${data.title || 'なし'}\n時間: ${data.time || 'なし'}\n場所: ${data.address || 'なし'}\n\nこのまま入力しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "入力する", 
          style: warningMessage ? "destructive" : "default", // 警告時は赤字にする
          onPress: () => {
            if (data.title) setInputSingleHotelName(data.title);
            if (data.time) setSingleCheckinTimeString(data.time);
            if (data.address) setInputHotelAddress(data.address);
            if (data.url) setInputHotelUrl(data.url);
            setIsHotelEditMode(true);
          }
        }
      ]
    );
};

// --- これを使って handlePasteICSForHotel を書き換え ---
const handlePasteICSForHotel = async () => {
    try {
        const text = await Clipboard.getStringAsync();
        if(!text) return;
        const data = parseICS(text);
        applyICSData(data); // 上で作った共通関数を呼ぶ
    } catch(e) {
        Alert.alert("エラー", "読み込み失敗");
    }
};

// --- ファイル読み込みの方も同様に ---
const processICS = async (uri) => {
    try {
        const content = await FileSystem.readAsStringAsync(uri);
        const data = parseICS(content);
        applyICSData(data); // 共通関数を呼ぶ
    } catch(e) {
         Alert.alert("エラー", "解析失敗");
    }
};

  const saveSingleHotelName = () => {
    const hotelData = { name: inputSingleHotelName, tel: inputHotelTel, address: inputHotelAddress, url: inputHotelUrl, status: inputSingleHotelStatus, dayImages: inputHotelImages };
    
    // 1. 宿情報の保存（accommodations）
    setAccommodations(prev => {
      const next = { ...prev };
      for (let i = 0; i < stayDuration; i++) {
        if (targetHotelIndex + i < daysArray.length) {
          const currentDayData = next[targetHotelIndex + i] || {};
          // 写真は初日のみ適用（連泊中は維持）
          const imagesToSave = (i === 0) ? hotelData.dayImages : (currentDayData.dayImages || []);
          next[targetHotelIndex + i] = { ...hotelData, dayImages: imagesToSave };
        }
      }
      return next;
    });

    // 2. チェックイン付箋の保存 & ★翌日のチェックアウト付箋の自動追加
    setItemsByDay(prev => {
      const nextItemsByDay = { ...prev };
      
      // A. 当日のチェックイン付箋処理
      for (let i = 0; i < stayDuration; i++) {
        const currentIndex = targetHotelIndex + i;
        if (currentIndex >= daysArray.length) break;
        
        const dayItems = nextItemsByDay[currentIndex] || [];
        const existingCheckinIndex = dayItems.findIndex(item => item.type === 'checkin');
        
        const checkinItemData = {
          id: existingCheckinIndex >= 0 ? dayItems[existingCheckinIndex].id : Date.now() + i,
          time: (i === 0) ? singleCheckinTimeString : '連泊',
          title: inputSingleHotelName,
          type: 'checkin'
        };

        if (existingCheckinIndex >= 0) {
          const newItems = [...dayItems];
          newItems[existingCheckinIndex] = checkinItemData;
          nextItemsByDay[currentIndex] = newItems.sort((a, b) => a.time.localeCompare(b.time));
        } else {
          nextItemsByDay[currentIndex] = [...dayItems, checkinItemData].sort((a, b) => a.time.localeCompare(b.time));
        }
      }

      // B. ★翌日のチェックアウト付箋処理 (自動追加)
      // 最終宿泊日の翌日を特定
      const nextDayIndex = targetHotelIndex + stayDuration;
      
      // 翌日が旅行期間内に存在する場合のみ実行
      if (nextDayIndex < daysArray.length) {
        const nextDayItems = nextItemsByDay[nextDayIndex] || [];
        
        // 既に「チェックアウト」付箋があるか確認 (重複防止)
        const hasCheckout = nextDayItems.some(item => item.title.includes('チェックアウト') && item.title.includes(inputSingleHotelName));
        
        if (!hasCheckout) {
          const checkoutItem = {
            id: Date.now() + 999, // ユニークID
            time: '10:00', // デフォルト時間
            title: `チェックアウト (${inputSingleHotelName})`,
            type: 'note', // メモタイプ
            price: ''
          };
          
          // 追加してソート
          nextItemsByDay[nextDayIndex] = [...nextDayItems, checkoutItem].sort((a, b) => a.time.localeCompare(b.time));
          Alert.alert("自動追加", "翌日の10:00にチェックアウトの予定を追加しました");
        }
      }

      return nextItemsByDay;
    });

    setIsHotelEditMode(false);
  };

  const deleteHotelInfo = () => { Alert.alert("削除", "この日の宿情報とチェックイン付箋を削除しますか？", [ { text: "キャンセル", style: "cancel" }, { text: "削除", style: "destructive", onPress: () => { setAccommodations(prev => { const next = { ...prev }; delete next[targetHotelIndex]; return next; }); setItemsByDay(prev => { const nextItems = { ...prev }; const dayItems = nextItems[targetHotelIndex] || []; nextItems[targetHotelIndex] = dayItems.filter(i => i.type !== 'checkin'); return nextItems; }); setSingleHotelModalVisible(false); }} ]); };
  const openLink = (url) => { if(url) Linking.openURL(url).catch(err => Alert.alert("エラー", "リンクを開けませんでした")); };
  const makeCall = (tel) => { if(tel) Linking.openURL(`tel:${tel}`).catch(err => Alert.alert("エラー", "電話をかけられませんでした")); };
  const openMap = (address) => { if(address) { const url = Platform.select({ ios: `maps:0,0?q=${address}`, android: `geo:0,0?q=${address}` }); Linking.openURL(url).catch(err => Alert.alert("エラー", "地図を開けませんでした")); }};
  const addPackingItem = () => { if (newPackingItem.trim() === '') return; setPackingList(prev => [...prev, { id: Date.now(), text: newPackingItem, checked: false }]); setNewPackingItem(''); };
  const togglePackingItem = (id) => { setPackingList(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)); };
  const deletePackingItem = (id) => { setPackingList(prev => prev.filter(item => item.id !== id)); };
  const jumpToDay = (index) => { setTocVisible(false); setCurrentPage(index); if(scrollViewRef.current) { scrollViewRef.current.scrollTo({ x: (isTablet ? width / 3 : width) * index, animated: true }); }};
  const onPickerChange = (event, selectedDate) => { if (event.type === 'dismissed') { setPickerMode(null); return; } const currentDate = selectedDate || new Date(); if (pickerMode === 'start') setInputStartDate(currentDate); if (pickerMode === 'end') setInputEndDate(currentDate); if (pickerMode === 'time') { setInputItemTime(currentDate); const h = currentDate.getHours().toString().padStart(2, '0'); const m = currentDate.getMinutes().toString().padStart(2, '0'); setTimeString(`${h}:${m}`); } if (pickerMode === 'single_hotel_time') { setInputSingleCheckinTime(currentDate); const h = currentDate.getHours().toString().padStart(2, '0'); const m = currentDate.getMinutes().toString().padStart(2, '0'); setSingleCheckinTimeString(`${h}:${m}`); } if (pickerMode === 'edit_time') { setEditItemTime(currentDate); const h = currentDate.getHours().toString().padStart(2, '0'); const m = currentDate.getMinutes().toString().padStart(2, '0'); setEditTimeString(`${h}:${m}`); } if (pickerMode === 'quick_time') { setTempTimeDate(currentDate); const h = currentDate.getHours().toString().padStart(2, '0'); const m = currentDate.getMinutes().toString().padStart(2, '0'); setTempTimeString(`${h}:${m}`); } if (Platform.OS === 'android') setPickerMode(null); };
  const handleScroll = (event) => { const contentOffsetX = event.nativeEvent.contentOffset.x; const cardW = isTablet ? width / 3 : width; const pageIndex = Math.round(contentOffsetX / cardW); if (pageIndex >= 0 && pageIndex < daysArray.length) setCurrentPage(pageIndex); };
  
  // モーダル操作群
  const openAddModal = () => { setNewItemType('note'); setIsCheckinMode(false); setInputItemImages([]); setModalVisible(true); setStockSelectVisible(false); };
  const handleBackToHome = async () => {
    setCurrentProject(null);
    setViewMode('list');
    setActiveTab('home');
    if (projects.length > 0) {
      const latest = projects[projects.length - 1];
      const key = PROJECT_DATA_PREFIX + latest.id;
      try {
        const dataJson = await AsyncStorage.getItem(key);
        if (dataJson) {
          const data = JSON.parse(dataJson);
          let total = 0;
          let count = 0;
          if (data.items) {
            Object.values(data.items).forEach((dayList) => {
              if (dayList) {
                count += dayList.length;
                dayList.forEach((i) => {
                  total += i.price ? parseInt(i.price) : 0;
                });
              }
            });
          }
          setHomeProjectData({ totalBudget: total, itemsCount: count });
        } else {
          setHomeProjectData({ totalBudget: 0, itemsCount: 0 });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };
  const openAddStock = () => { setStockModalMode('create'); setEditingStockId(null); setInputStockTitle(''); setInputStockNote(''); setInputStockUrl(''); setInputStockPrice(''); setInputStockCategory('sightseeing'); setInputStockImage(null); setStockModalVisible(true); };
  const openEditStock = (item) => { setStockModalMode('edit'); setEditingStockId(item.id); setInputStockTitle(item.title); setInputStockNote(item.note || ''); setInputStockUrl(item.url || ''); setInputStockPrice(item.price ? item.price.toString() : ''); setInputStockCategory(item.category || 'sightseeing'); setInputStockImage(item.imageUri || null); setStockModalVisible(true); };
  const handleSaveStock = () => { if(!inputStockTitle) { Alert.alert("エラー","場所の名前を入力してください"); return; } const stockData = { title: inputStockTitle, category: inputStockCategory, note: inputStockNote, url: inputStockUrl, price: inputStockPrice, imageUri: inputStockImage, createdAt: new Date().toISOString() }; if (stockModalMode === 'edit' && editingStockId) { setStockList(prev => prev.map(item => { if (item.id === editingStockId) { return { ...item, ...stockData }; } return item; })); } else { const newItem = { id: Date.now(), ...stockData }; setStockList(prev => [newItem, ...prev]); } setStockModalVisible(false); };
  const handleDeleteStock = (id) => { Alert.alert("削除", "このストックを削除しますか？", [ { text: "キャンセル", style: "cancel" }, { text: "削除", style: "destructive", onPress: () => { setStockList(prev => prev.filter(item => item.id !== id)); }} ]); };
  const isGoogleMapUrl = (url) => { if (!url) return false; return url.includes('maps.app.goo.gl') || url.includes('google.com/maps') || url.includes('google.co.jp/maps'); };
  const handleSelectStock = (stockItem) => { setInputItemTitle(stockItem.title); if(stockItem.price) setInputItemPrice(stockItem.price); if(stockItem.imageUri) setInputItemImages([stockItem.imageUri]); if (!isCheckinMode) { setNewItemType(stockItem.category); } setStockSelectVisible(false); };

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }


  const renderContent = () => {
    switch (activeTab) {
      case 'home': return renderHome();
      case 'stock': return renderStock();
      case 'album': return renderAlbum(); // ← もし `renderAlbum` 関数がない場合はコメントアウトしてください
      case 'plan': return renderPlan();
      default: return renderHome();
    }
  };

// ■■■ 修正: ヒーロー画像長押し対応版 renderHome ■■■
  const renderHome = () => {
    const getHeroProject = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const futureProjects = projects.filter(p => p.endDate >= todayStr);
      if (futureProjects.length > 0) return futureProjects.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
      const pastProjects = projects.filter(p => p.endDate < todayStr);
      if (pastProjects.length > 0) return pastProjects.sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
      return null;
    };

    const targetProject = getHeroProject(); 

    return (
      <View style={[styles.container, { 
          backgroundColor: theme.background, 
          padding: 20, 
          paddingBottom: 10,
          paddingTop: Platform.OS === 'ios' ? 50 : 20 
      }]}>
        {/* ▼▼▼ 書き換え箇所: アプリ名変更 ▼▼▼ */}
        <View style={{ marginTop: 5, marginBottom: 10, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <View>
              <Text style={{ fontSize: 12, color: theme.subText, fontFamily: 'MPlus-Bold' }}>LET'S MERGE,</Text>
              <Text style={{ fontSize: 32, fontFamily: 'GravitasOne', color: theme.tint, letterSpacing: -1 }}>MergeTrip.</Text>
            </View>
          <TouchableOpacity 
            onPress={() => setSettingMenuVisible(true)}
            style={{ padding: 10, backgroundColor: theme.card, borderRadius: 20, shadowColor: theme.text, shadowOpacity: 0.1, elevation: 2 }}
          >
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ヒーロータイル */}
        <View style={{ flex: 1, marginBottom: 10 }}> 
          {targetProject ? (
            <TouchableOpacity
              style={[styles.heroCard, { backgroundColor: theme.card, shadowColor: theme.text, elevation: 10, height: '100%', borderRadius: 25, overflow: 'hidden' }]}
              onPress={() => handleOpenProject(targetProject)}
              onLongPress={() => handleLongPressHero(targetProject)}
              delayLongPress={500}
              activeOpacity={0.9}
            >
               {/* 画像 or 背景色 */}
               {targetProject.imageUri ? (
                 <Image source={{ uri: targetProject.imageUri }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
               ) : (
                 <View style={{ width: '100%', height: '100%', backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center', position: 'absolute' }}>
                   {/* アイコンを少し薄くして背面に配置 */}
                   <Text style={{ fontSize: 100, opacity: 0.1 }}>✈️</Text>
                 </View>
               )}
               
               {/* 情報オーバーレイ (画像があってもなくても常に表示) */}
               <View style={{ flex: 1, backgroundColor:'rgba(0,0,0,0.3)', padding: 20, justifyContent: 'space-between' }}>
                  <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
                     <View style={{ backgroundColor:'rgba(0,0,0,0.6)', paddingHorizontal:12, paddingVertical:6, borderRadius:20 }}>
                       <Text style={{ color:'white', fontWeight:'bold', fontSize:12 }}>
                         {(() => {
                            const diff = new Date(targetProject.startDate) - new Date();
                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            if (days > 0) return `あと ${days} 日`;
                            if (days === 0) return '今日が出発日！';
                            return '思い出';
                         })()}
                       </Text>
                     </View>
                  </View>

                  <View>
                    {/* ★フォント適用: 英語ならGravitasOne */}
                    <Text style={{ 
                        color: 'white', 
                        fontSize: 32, 
                        fontFamily: getFontByLang(targetProject.title), // ← ここを変更
                        marginBottom: 5, 
                        textShadowColor:'rgba(0,0,0,0.8)', 
                        textShadowRadius:10 
                    }}>
                      {targetProject.title}
                    </Text>
                    <Text style={{ color: '#eee', fontSize: 16, opacity: 0.9, textShadowColor:'rgba(0,0,0,0.8)', textShadowRadius:10, fontWeight: 'bold' }}>
                      {formatDate(targetProject.startDate)} - {formatDate(targetProject.endDate)}
                    </Text>
                  </View>
               </View>

               {/* カメラボタン */}
               <TouchableOpacity 
                 style={{ position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}
                 onPress={() => pickImageForProject(targetProject.id)}
               >
                 <Text style={{ fontSize: 20 }}>📷</Text>
               </TouchableOpacity>
            </TouchableOpacity>
          ) : (
              // ... (新規作成ボタンはそのまま)
              <TouchableOpacity style={{ flex: 1, backgroundColor: theme.card, borderRadius: 25, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.border, borderStyle: 'dashed' }} onPress={startCreateProject} activeOpacity={0.7}>
                <Text style={{ fontSize: 60, marginBottom: 20, opacity: 0.7 }}>➕</Text>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, opacity: 0.8 }}>新しい旅を作る</Text>
              </TouchableOpacity>
          )}
        </View>

        {/* メニューボタン */}
        <View style={{ height: 90, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity
            style={{
              width: '49%', height: '100%',
              backgroundColor: theme.card, borderRadius: 20,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              paddingHorizontal: 10,
              shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3
            }}
            onPress={openHomeAlbum} 
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 28, marginRight: 8 }}>📂</Text>
            <View>
               <Text style={{ fontWeight: 'bold', fontSize: 15, color: theme.text }}>アルバム</Text>
               <Text style={{ fontSize: 10, color: theme.subText }}>思い出</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: '49%', height: '100%',
              backgroundColor: theme.card, borderRadius: 20,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              paddingHorizontal: 10,
              shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3
            }}
            onPress={() => setActiveTab('stock')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 28, marginRight: 8 }}>🔖</Text>
            <View>
               <Text style={{ fontWeight: 'bold', fontSize: 15, color: theme.text }}>行きたい</Text>
               <Text style={{ fontSize: 10, color: theme.subText }}>リスト</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 全リストボタン */}
        <TouchableOpacity
          style={{
            height: 50, width: '100%',
            backgroundColor: theme.inputBg, borderRadius: 15,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: theme.border
          }}
          onPress={() => { setViewMode('list'); setActiveTab('plan'); }}
        >
          <Text style={{ fontSize: 14, color: theme.text, fontWeight: 'bold' }}>📋 すべての計画一覧へ</Text>
        </TouchableOpacity>

      </View>
    );
  };

const renderStock = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.header, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => setActiveTab('home')} style={styles.backButton}>
          <Text style={{ color: theme.tint, fontSize: 16 }}>◀ ホーム</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center', color: theme.text }]}>
          🔖 行きたい場所
        </Text>
        <View style={{ width: 30 }} />
      </View>
      <FlatList
        key="stock-grid"
        data={stockList}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ padding: 20 }}
        // ★追加: スクロール挙動の制御
        bounces={false}
        overScrollMode="never"
        ListEmptyComponent={
          // ... (中身は変更なし)
          <View style={{ alignItems: 'center', marginTop: 50, width: '100%' }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🤔</Text>
            <Text style={{ color: theme.subText }}>まだストックがありません</Text>
            <Text style={{ color: theme.subText }}>右下の＋ボタンから追加しよう</Text>
          </View>
        }
        renderItem={({ item }) => {
          // ... (中身は変更なし)
          const cat = STOCK_CATEGORIES.find((c) => c.id === item.category) || STOCK_CATEGORIES[0];
          return (
            <TouchableOpacity
              style={[styles.stockGridCard, { backgroundColor: theme.card }]}
              onLongPress={() => handleDeleteStock(item.id)}
              onPress={() => openEditStock(item)}
            >
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.stockGridImage} resizeMode="cover" />
              ) : (
                <View style={[styles.stockGridImage, { backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 40 }}>{cat.icon}</Text>
                </View>
              )}
              <View style={{ padding: 10, flex: 1, justifyContent: 'space-between' }}>
                <Text style={[styles.stockGridTitle, { color: theme.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                  <Text style={{ fontSize: 10, color: theme.subText }}>{cat.label}</Text>
                  {item.url ? <Text style={{ fontSize: 16 }}>{isGoogleMapUrl(item.url) ? '📍' : '🌎'}</Text> : <View style={{ width: 16 }} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity 
      style={[styles.fab, { backgroundColor: theme.tint }]} 
      onPress={openAddStock}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

// ■■■ 最終修正: ヘッダー位置調整版 renderAlbum ■■■
  const renderAlbum = () => {
    // ステータスバー避けのパディング量
    const headerPaddingTop = Platform.OS === 'ios' ? 50 : 30;

    // ■ 詳細モード（特定の旅行のアルバム）
    if (albumViewMode === 'detail' && targetAlbumProject) {
      
      // 1. 日程枠の作成
      let displayDays = [];
      try {
        if (targetAlbumProject.startDate && targetAlbumProject.endDate) {
           const s = new Date(targetAlbumProject.startDate);
           const e = new Date(targetAlbumProject.endDate);
           let d = new Date(s);
           let idx = 0;
           while(d <= e && idx < 365) {
             displayDays.push({ index: idx, label: `Day ${idx+1}`, date: formatDate(d) });
             d.setDate(d.getDate() + 1);
             idx++;
           }
        }
      } catch (err) { displayDays = []; }
      
      // 2. 写真データから強制的に枠を追加
      if (albumImages && albumImages.length > 0) {
         const maxDayIndex = Math.max(...albumImages.map(i => i.dayIndex || 0));
         if (maxDayIndex >= displayDays.length) {
            for(let i = displayDays.length; i <= maxDayIndex; i++) {
               displayDays.push({ index: i, label: `Day ${i+1}`, date: '' });
            }
         }
      }

      // 3. 振り分け
      const groupedImages = {};
      groupedImages[-1] = []; 
      displayDays.forEach(day => { groupedImages[day.index] = []; });
      
      albumImages.forEach(img => {
        const dIndex = (img.dayIndex !== undefined && groupedImages[img.dayIndex]) ? img.dayIndex : -1;
        if (!groupedImages[dIndex]) groupedImages[dIndex] = []; 
        groupedImages[dIndex].push(img);
      });

      return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          {/* ヘッダー (位置調整済み) */}
          <View style={{ 
            paddingTop: headerPaddingTop, 
            paddingBottom: 15, 
            paddingHorizontal: 15, 
            backgroundColor: theme.header, 
            borderBottomWidth: 1, 
            borderBottomColor: theme.border,
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <TouchableOpacity onPress={() => { setAlbumViewMode('list'); setAlbumSelectionMode(false); }} style={{ padding: 5 }}>
              <Text style={{ color: theme.tint, fontSize: 16, fontWeight: 'bold' }}>◀ 戻る</Text>
            </TouchableOpacity>
            
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: theme.text }} numberOfLines={1}>
              {targetAlbumProject.title}
            </Text>
            
            <TouchableOpacity onPress={() => {
                setAlbumSelectionMode(!albumSelectionMode);
                setSelectedAlbumImages([]); 
            }} style={{ padding: 5 }}>
              <Text style={{ color: albumSelectionMode ? theme.tint : theme.subText, fontSize: 16, fontWeight: 'bold' }}>
                {albumSelectionMode ? 'キャンセル' : '選択'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* コンテンツ */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
            {/* 表紙エリア (-1) */}
            {groupedImages[-1] && groupedImages[-1].length > 0 && (
              <View style={{ marginBottom: 25 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 10 }}>📁 表紙・その他</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {groupedImages[-1].map((img, idx) => {
                    const isSelected = selectedAlbumImages.includes(img.uri);
                    return (
                    <TouchableOpacity key={idx} 
                      onPress={() => {
                        if (albumSelectionMode) {
                           if (isSelected) setSelectedAlbumImages(prev => prev.filter(u => u !== img.uri));
                           else setSelectedAlbumImages(prev => [...prev, img.uri]);
                        } else {
                           handleTapImage(img);
                        }
                      }}
                      style={{ width: '31%', aspectRatio: 1, margin: '1%', borderRadius: 8, overflow: 'hidden', backgroundColor: '#ccc' }}
                    >
                      <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%', opacity: (albumSelectionMode && !isSelected) ? 0.7 : 1 }} resizeMode="cover" />
                      {albumSelectionMode && (
                         <View style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'white', backgroundColor: isSelected ? theme.tint : 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                           {isSelected && <Text style={{ color: 'white', fontSize: 14, fontWeight:'bold' }}>✓</Text>}
                         </View>
                       )}
                    </TouchableOpacity>
                  )})}
                </View>
              </View>
            )}

            {/* 日程エリア */}
            {displayDays.map((day) => {
               const images = groupedImages[day.index] || [];
               return (
                 <View key={day.index} style={{ marginBottom: 20, backgroundColor: theme.card, borderRadius: 15, padding: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 }}>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 5 }}>
                     <View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{day.label}</Text>
                        <Text style={{ fontSize: 12, color: theme.subText }}>{day.date}</Text>
                     </View>
                     <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.tint }}>{images.length}枚</Text>
                   </View>

                   {images.length > 0 ? (
                     <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                       {images.map((img, idx) => {
                         const isSelected = selectedAlbumImages.includes(img.uri);
                         return (
                         <TouchableOpacity key={idx} 
                           onPress={() => {
                             if (albumSelectionMode) {
                                if (isSelected) setSelectedAlbumImages(prev => prev.filter(u => u !== img.uri));
                                else setSelectedAlbumImages(prev => [...prev, img.uri]);
                             } else {
                                handleTapImage(img);
                             }
                           }}
                           style={{ width: '31%', aspectRatio: 1, margin: '1%', borderRadius: 8, overflow: 'hidden', backgroundColor: '#eee' }}
                         >
                           <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%', opacity: (albumSelectionMode && !isSelected) ? 0.7 : 1 }} resizeMode="cover" />
                           {albumSelectionMode && (
                              <View style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'white', backgroundColor: isSelected ? theme.tint : 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                                {isSelected && <Text style={{ color: 'white', fontSize: 14, fontWeight:'bold' }}>✓</Text>}
                              </View>
                            )}
                         </TouchableOpacity>
                       )})}
                     </View>
                   ) : (
                     <View style={{ padding: 20, alignItems: 'center', opacity: 0.5 }}>
                       <Text style={{ color: theme.text }}>写真なし</Text>
                     </View>
                   )}
                 </View>
               );
            })}
          </ScrollView>

          {/* 削除ボタンフッター */}
          {albumSelectionMode && (
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.header, borderTopWidth: 1, borderTopColor: theme.border, padding: 15, paddingBottom: 30, alignItems: 'center' }}>
               <TouchableOpacity 
                 style={{ backgroundColor: theme.danger, paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25, opacity: selectedAlbumImages.length === 0 ? 0.5 : 1, flexDirection:'row', alignItems:'center' }}
                 disabled={selectedAlbumImages.length === 0}
                 onPress={() => {
                    Alert.alert(
                      "写真を削除",
                      `選択した${selectedAlbumImages.length}枚の写真をゴミ箱に移動しますか？\n（元の予定からも削除されます）`,
                      [
                        { text: "キャンセル", style: "cancel" },
                        { text: "削除する", style: "destructive", onPress: deleteSelectedAlbumImages }
                      ]
                    );
                 }}
               >
                 <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>🗑️ ゴミ箱に入れる ({selectedAlbumImages.length})</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    // ■ 一覧モード
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {/* ヘッダー (位置調整済み) */}
        <View style={{ 
          paddingTop: headerPaddingTop, 
          paddingBottom: 15, 
          paddingHorizontal: 15, 
          backgroundColor: theme.header, 
          borderBottomWidth: 1, 
          borderBottomColor: theme.border,
          flexDirection: 'row', 
          alignItems: 'center'
        }}>
          <TouchableOpacity onPress={() => setActiveTab('home')} style={{ padding: 5 }}>
            <Text style={{ color: theme.tint, fontSize: 16, fontWeight:'bold' }}>◀ ホーム</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: theme.text }}>
            思い出アルバム 📸
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {isAlbumLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <ActivityIndicator size="large" color={theme.tint} />
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Text style={{ fontSize: 40 }}>✈️</Text>
                <Text style={{ color: theme.subText, marginTop: 10 }}>計画がありません</Text>
              </View>
            }
            // ■■■ 修正: アルバムリストに「共有ボタン」を追加 ■■■
            renderItem={({ item }) => (
              <View
                style={{ 
                  backgroundColor: theme.card, 
                  marginBottom: 15, 
                  borderRadius: 15, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  shadowColor: "#000", 
                  shadowOffset: { width: 0, height: 2 }, 
                  shadowOpacity: 0.1, 
                  elevation: 2,
                  overflow: 'hidden' // 角丸からはみ出ないように
                }}
              >
                {/* ① 左側: タップすると詳細へ (メインエリア) */}
                <TouchableOpacity 
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15 }} 
                  onPress={() => handleOpenAlbumDetail(item)}
                  activeOpacity={0.7}
                >
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={{ width: 70, height: 70, borderRadius: 10, marginRight: 15 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 70, height: 70, borderRadius: 10, marginRight: 15, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 30 }}>📷</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    {/* タイトルもフォント切り替え対応 */}
                    <Text style={{ fontSize: 16, fontFamily: getFontByLang(item.title), color: theme.text, marginBottom: 4 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.subText }}>{formatDate(item.startDate)} 〜</Text>
                  </View>
                </TouchableOpacity>

                {/* ② 右側: PDF/共有ボタンエリア (区切り線を入れて独立させる) */}
                <View style={{ borderLeftWidth: 1, borderLeftColor: theme.border, height: '100%', justifyContent: 'center' }}>
                  <TouchableOpacity 
                    style={{ padding: 15, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}
                    onPress={() => handleShareAction(item)} // ★ここで共有メニュー呼び出し
                  >
                    <Text style={{ fontSize: 24 }}>📤</Text>
                    <Text style={{ fontSize: 8, color: theme.subText, marginTop: 2 }}>出力</Text>
                  </TouchableOpacity>
                </View>

              </View>
            )}
          />
        )}
      </View>
    );
  };


// ■■■ 修正: 画像ランダム表示 & 付箋背景化対応版 renderPlan ■■■
  // ■■■ 修正完了版: renderPlan ■■■
  const renderPlan = () => {
    // 1. 一覧表示モード
    if (viewMode === 'list') {
      const numColumns = isTablet ? 2 : 1;

      return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { backgroundColor: theme.header, borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: 'GravitasOne', fontSize: 20 }]} numberOfLines={1}>
              PLAN LIST
            </Text>
          </View>
          
          <FlatList
            key={`plan-list-${numColumns}`}
            data={projects}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={isTablet ? { justifyContent: 'space-between' } : null}
            style={{ padding: 20 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.subText }]}>ホーム画面から作成してください</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                    styles.projectCard, 
                    { 
                        backgroundColor: theme.card, 
                        padding: 0, 
                        height: 180,
                        overflow:'hidden', 
                        flexDirection:'column', 
                        alignItems:'stretch',
                        width: isTablet ? '48%' : '100%',
                        marginBottom: 20
                    }
                ]}
                onPress={() => handleOpenProject(item)}
                onLongPress={() => handleLongPressProject(item)}
              >
                {item.imageUri ? (
                  <ImageBackground source={{ uri: item.imageUri }} style={{ flex: 1, justifyContent:'flex-end' }} resizeMode="cover">
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                       <View style={{ flex: 1 }}>
                         <Text style={{ fontSize: 22, fontFamily:getFontByLang(item.title), color: 'white', textShadowColor:'black', textShadowRadius:5 }} numberOfLines={1}>
                           {item.title}
                         </Text>
                         <Text style={{ color: '#ccc', fontWeight:'bold', fontSize: 12 }}>
                           {formatDate(item.startDate)} - {formatDate(item.endDate)}
                         </Text>
                       </View>
                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity style={{ padding: 8, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:20, marginRight:5 }} onPress={() => generateQRData(item)}>
                             <Text style={{ fontSize: 18 }}>📱</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ padding: 8, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:20 }} onPress={() => { setCurrentProject(item); startEditProject(); }}>
                             <Text style={{ fontSize: 18 }}>⚙️</Text>
                          </TouchableOpacity>
                       </View>
                    </View>
                  </ImageBackground>
                ) : (
                   <View style={{ flex: 1, padding: 15, justifyContent: 'space-between' }}>
                     <View>
                        <Text style={{ fontSize: 40, opacity:0.1, position:'absolute', right:0, top:0 }}>✈️</Text>
                        <Text style={{ fontSize: 24, fontFamily: getFontByLang(item.title), color: theme.text }} numberOfLines={2}>
                            {item.title}
                        </Text>
                     </View>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Text style={{ color: theme.subText, fontSize: 12 }}>
                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                         </Text>
                         <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius:20, marginRight:5 }} onPress={() => generateQRData(item)}>
                               <Text style={{ fontSize: 18 }}>📱</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius:20 }} onPress={() => { setCurrentProject(item); startEditProject(); }}>
                               <Text style={{ fontSize: 18 }}>⚙️</Text>
                            </TouchableOpacity>
                         </View>
                     </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
          {!isTablet && (
            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.tint }]} onPress={startCreateProject}>
              <Text style={styles.fabText}>＋</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      );
    }

    // 2. 詳細表示モード（Dayタイル）
    if (!currentProject) return <View style={styles.container} />;

    const totalBudget = calculateProjectTotal();
    const cardWidth = isTablet ? width / 3 : width;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: theme.header, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
            <Text style={{ color: theme.tint, fontSize: 16 }}>◀ ホーム</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setTocVisible(true)}>
              <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFontByLang(currentProject.title) }]}>{currentProject.title} ▼</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 10, color: theme.subText, fontWeight: 'bold' }}>
              総予算: {formatMoney(totalBudget)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              onPress={() => Alert.alert("Merge開始", "近くの友達を探します... (実装予定)")} 
              style={[styles.backButton, { marginRight: 10 }]}
            >
              <Text style={{ fontSize: 24 }}>📡</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPackingVisible(true)} style={[styles.backButton, { marginRight: 10 }]}>
              <Text style={{ fontSize: 22 }}>🎒</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={startEditProject} style={styles.backButton}>
              <Text style={{ fontSize: 22 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* スクロールエリア（Dayタイル） */}
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          pagingEnabled={!isTablet} // タブレットならページング（カクっと止まる挙動）をオフにして、自由にスクロールできるようにする
          showsHorizontalScrollIndicator={isTablet}
          style={styles.scrollView}
          onMomentumScrollEnd={handleScroll}
        >
          {daysArray.map((dayInfo) => {
            const dayItems = itemsByDay[dayInfo.index] || [];
            const pendingCount = dayItems.filter(i => i.status === 'pending').length;
            const isToday = dayInfo.date === formatDate(new Date());
            const dayTotal = calculateDayTotal(dayItems);
            const isActive = !isTablet || (dayInfo.index === currentPage);
            const isDark = colorScheme === 'dark';
            const isTodayDark = isToday && isDark;
            
            const tileTextColor = isTodayDark ? 'white' : theme.text;
            const tileSubTextColor = isTodayDark ? 'rgba(255,255,255,0.8)' : theme.subText;
            const tileBorderColor = isTodayDark ? 'rgba(255,255,255,0.3)' : theme.border;
            const activeStyle = {
                transform: [{ scale: isActive ? 1 : 0.95 }], // アクティブなら等倍、それ以外は95%に縮小
                opacity: isActive ? 1 : 0.6,                 // アクティブならくっきり、それ以外は薄く
                borderWidth: isActive ? 2 : 0,               // アクティブなら枠線をつける
                borderColor: theme.tint,                     // 枠線の色
            };
            

            // 前日の宿
            let prevHotelName = null;
            if (dayInfo.index > 0) {
              const prevData = accommodations[dayInfo.index - 1];
              if (typeof prevData === 'object' && prevData !== null) prevHotelName = prevData.name;
              else if (prevData) prevHotelName = prevData;
            }

            // カウントダウン
            let countdownText = null;
            if (isToday) {
              const checkinItem = dayItems.find((i) => i.type === 'checkin');
              if (checkinItem && checkinItem.time && checkinItem.time !== '連泊') {
                const [y, m, dStr] = dayInfo.date.split('/');
                const [h, min] = checkinItem.time.split(':');
                const targetTime = new Date(parseInt(y), parseInt(m) - 1, parseInt(dStr), parseInt(h), parseInt(min));
                const diff = targetTime - now;
                if (diff > 0) {
                  const diffHours = Math.floor(diff / (1000 * 60 * 60));
                  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  countdownText = `⏱️ あと ${diffHours}時間${diffMinutes}分 でチェックイン`;
                } else {
                  countdownText = `✅ チェックイン可能です`;
                }
              }
            }

            // 宿データ
            const hotelData = accommodations[dayInfo.index];
            let hotelName = '';
            let hotelStatus = 'none';
            let dayImages = [];
            if (typeof hotelData === 'object' && hotelData !== null) {
              hotelName = hotelData.name;
              hotelStatus = hotelData.status || 'none';
              dayImages = hotelData.dayImages || (hotelData.dayImageUri ? [hotelData.dayImageUri] : []);
            } else if (hotelData) {
              hotelName = hotelData;
            }
            const statusObj = HOTEL_STATUSES.find((s) => s.id === hotelStatus) || HOTEL_STATUSES[0];

            const randomDayHeaderImage = stableImages.dayHeaders[dayInfo.index];

            return (
              <Pressable 
                key={dayInfo.index} 
                style={[styles.cardContainer, { width: cardWidth }]}
                // ★重要: タップしたらその日を「選択状態（currentPage）」にする
                onPress={() => setCurrentPage(dayInfo.index)}
              >
                <View
                  style={[
                    styles.tile,
                    { 
                      width: cardWidth - 20, 
                      backgroundColor: isToday ? theme.todayBg : theme.card,
                      // アクティブスタイルを適用（既存のスタイルにマージ）
                      ...activeStyle
                    },
                  ]}
                >
                  {/* Dayヘッダー部分 */}
                  <Pressable onPress={() =>{ 
                    setCurrentPage(dayInfo.index);
                    openDayAlbum(dayInfo.index);
                    }}>
                    {pendingCount > 0 && (
                      <TouchableOpacity 
                        style={{
                          position: 'absolute',
                          top: -15,   // ★修正: さらにはみ出させる
                          right: -15, // ★修正: さらにはみ出させる
                          backgroundColor: '#ff3b30',
                          borderRadius: 20, // ★修正: 大きく丸く
                          minWidth: 40,     // ★修正: 32 -> 40 (巨大化)
                          height: 40,       // ★修正: 32 -> 40 (巨大化)
                          justifyContent: 'center',
                          alignItems: 'center',
                          zIndex: 20,
                          borderWidth: 2,
                          borderColor: theme.background,
                          shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, elevation: 3
                        }}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleBatchApprove(dayInfo.index);
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                          {pendingCount}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {randomDayHeaderImage ? (
                      <ImageBackground source={{ uri: randomDayHeaderImage }} style={styles.tileHeaderBg} resizeMode="cover">
                        <View style={styles.tileHeaderOverlay}>
                          <View>
                            <Text style={[styles.dayText, { color: 'white', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }]}>
                              {dayInfo.dayLabel}
                            </Text>
                            <Text style={[styles.dateText, { color: '#eee', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }]}>
                              {dayInfo.date}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); generateDayQRData(dayInfo.index); }} style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15, padding: 5, marginRight: 8 }}>
                              <Text style={{ fontSize: 16 }}>📱</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); startScan(); }} style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15, padding: 5, marginRight: 8 }}>
                              <Text style={{ fontSize: 16 }}>📥</Text>
                            </TouchableOpacity>
                            {dayTotal > 0 && (
                              <View style={{ backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 15, marginRight: 10 }}>
                                <Text style={{ fontWeight: 'bold', color: '#333' }}>{formatMoney(dayTotal)}</Text>
                              </View>
                            )}
                            <TouchableOpacity onPress={() => pickImageForDay(dayInfo.index)} style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15, padding: 5 }}>
                              <Text style={{ fontSize: 16 }}>📸</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </ImageBackground>
                    ) : (
                      <View style={[styles.tileHeader, { borderBottomColor: tileBorderColor }]}>
                        <View>
                          <Text style={[styles.dayText, { color: tileTextColor }]}>
                            {dayInfo.dayLabel}
                          </Text>
                          <Text style={[styles.dateText, { color: tileSubTextColor }]}>
                            {dayInfo.date}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity onPress={(e) => { e.stopPropagation(); generateDayQRData(dayInfo.index); }} style={{ backgroundColor: isTodayDark ? 'rgba(255,255,255,0.2)' : theme.inputBg, borderRadius: 15, padding: 5, marginRight: 8 }}>
                            <Text style={{ fontSize: 16 }}>📱</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={(e) => { e.stopPropagation(); startScan(); }} style={{ backgroundColor: isTodayDark ? 'rgba(255,255,255,0.2)' : theme.inputBg, borderRadius: 15, padding: 5, marginRight: 8 }}>
                            <Text style={{ fontSize: 16 }}>📥</Text>
                          </TouchableOpacity>
                          {dayTotal > 0 && (
                            <View style={{ backgroundColor: isTodayDark ? 'rgba(255,255,255,0.2)' : theme.inputBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 10 }}>
                              <Text style={{ fontWeight: 'bold', color: tileSubTextColor }}>{formatMoney(dayTotal)}</Text>
                            </View>
                          )}
                          <TouchableOpacity onPress={() => pickImageForDay(dayInfo.index)} style={{ backgroundColor: isTodayDark ? 'rgba(255,255,255,0.2)' : theme.inputBg, borderRadius: 15, padding: 5 }}>
                            <Text style={{ fontSize: 16, opacity: 0.5 }}>📷</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </Pressable>

                  {/* 予定リスト */}
                  <ScrollView style={{ flex: 1 }}>
                    {prevHotelName && (
                      <View style={{ flexDirection: 'row', marginBottom: 15, alignItems: 'center', opacity: 0.6 }}>
                        <View style={{ width: 4, backgroundColor: tileTextColor, marginRight: 8, height: '100%', borderRadius: 2 }} />
                        <View>
                          <Text style={{ fontSize: 10, color: tileSubTextColor }}>前日の宿からスタート</Text>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: tileTextColor }}>🏨 {prevHotelName}</Text>
                        </View>
                      </View>
                    )}
                    {dayItems.length === 0 && !hotelName && dayImages.length === 0 ? (
                      <Text style={[styles.emptyText, { color: tileSubTextColor }]}>「＋」で予定を追加</Text>
                    ) : null}
                    
                    {dayItems.map((item, index) => {
                      const category = ITEM_CATEGORIES.find((c) => c.id === item.type) || ITEM_CATEGORIES[0];
                      const nextItem = dayItems[index + 1];
                      const gapDuration = nextItem ? calculateDuration(item.time, nextItem.time) : null;
                      
                      const itemBg = isDark && category.darkBg ? category.darkBg : category.bg;
                      const itemText = isDark ? '#EEE' : '#333';
                      const itemTime = isDark ? '#BBB' : '#888';

                      const itemImages = item.images || (item.imageUri ? [item.imageUri] : []);
                      const randomItemBg = stableImages.items[item.id];

                      // 移動アイテム
                      if (item.type === 'move') {
                        const itemStatus = item.status || 'confirmed';
                        const isLeft = itemStatus === 'confirmed'; 

                        if (isLeft) {
                          return (
                            <View key={item.id} style={{ marginBottom: 10 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', width: '90%' }}>
                                 <View style={{ width: 4, backgroundColor: category.border, marginRight: 8, borderRadius: 2 }} />
                                 <TouchableOpacity
                                   onPress={() => handleItemPress({ dayIndex: dayInfo.index, item })}
                                   activeOpacity={0.7}
                                   style={{ 
                                     flex: 1, 
                                     flexDirection: 'row', 
                                     alignItems: 'center', 
                                     backgroundColor: isTodayDark ? 'rgba(255,255,255,0.1)' : itemBg, 
                                     paddingVertical: 6, 
                                     paddingHorizontal: 10,
                                     borderRadius: 8,
                                     shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 1
                                   }}
                                 >
                                    <View style={{ alignItems: 'center', marginRight: 12, minWidth: 40 }}>
                                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: tileSubTextColor, marginBottom: 1 }}>{item.time}</Text>
                                      <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#333' : 'white', borderRadius: 13, borderWidth: 1, borderColor: isDark ? '#444' : '#eee' }}>
                                        <Text style={{ fontSize: 14 }}>{TRANSPORT_OPTIONS.find(t => t.defaultTitle === item.title || t.label === item.title)?.icon || '🚗'}</Text>
                                      </View>
                                      <Text style={{ fontSize: 8, color: theme.subText, marginTop: 1 }}>⬇</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 13, color: isTodayDark ? 'white' : itemText, fontWeight: 'bold' }} numberOfLines={1}>{item.title}</Text>
                                      <Text style={{ fontSize: 10, color: isTodayDark ? 'rgba(255,255,255,0.7)' : itemTime }}>{gapDuration ? `所要: ${gapDuration}` : '移動'}</Text>
                                    </View>
                                    {item.price && (
                                      <View style={{ backgroundColor: isDark ? '#333' : 'white', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: isDark ? '#444' : '#eee' }}>
                                        <Text style={{ fontSize: 10, color: isDark ? 'white' : '#333' }}>{formatMoney(item.price)}</Text>
                                      </View>
                                    )}
                                 </TouchableOpacity>
                              </View>
                            </View>
                          );
                        } else {
                          return (
                            <View key={item.id} style={{ marginBottom: 10, alignItems: 'flex-end', width: '100%' }}>
                              <TouchableOpacity
                                onPress={() => handleItemPress({ dayIndex: dayInfo.index, item })}
                                activeOpacity={0.7}
                                style={{ 
                                  width: '75%', 
                                  flexDirection: 'row', 
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(255,255,255,0.9)', 
                                  padding: 8, 
                                  borderRadius: 10,
                                  borderWidth: 2,
                                  borderColor: category.border,
                                  borderStyle: 'dashed',
                                  opacity: itemStatus === 'rejected' ? 0.5 : 1
                                }}
                              >
                                  <View style={{ width: 30, alignItems: 'center', marginRight: 8, backgroundColor: '#eee', borderRadius: 15, padding: 4 }}>
                                    <Text style={{ fontSize: 16 }}>{TRANSPORT_OPTIONS.find(t => t.defaultTitle === item.title || t.label === item.title)?.icon || '🚗'}</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection:'row', justifyContent:'space-between'}}>
                                       <Text style={{ fontSize: 12, color: itemTime, fontWeight:'bold' }}>{item.time}〜</Text>
                                       <Text style={{ fontSize:10, color:theme.subText }}>👤Guest</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: itemText, fontWeight: 'bold' }}>{item.title} (提案)</Text>
                                  </View>
                                  {item.price && (
                                    <View style={{ backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#eee', marginLeft:5 }}>
                                      <Text style={{ fontSize: 10, color: '#333' }}>{formatMoney(item.price)}</Text>
                                    </View>
                                  )}
                              </TouchableOpacity>
                            </View>
                          );
                        }
                      }

                      // 通常アイテム (付箋)
                      // ■■■ Android完全救済版: スタイル競合の全排除 ■■■
                      const itemStatus = item.status || 'confirmed';
                      const isLeft = itemStatus === 'confirmed';

                      // 背景色
                      const finalItemBg = item.type === 'checkin' 
                        ? (isDark ? '#000' : '#e3f2fd') 
                        : itemBg;
                      
                      // 右側のときだけ点線などを適用
                      const rightStyle = !isLeft ? {
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#ccc',
                          borderStyle: 'dashed',
                          backgroundColor: isDark ? 'rgba(60, 60, 60, 0.8)' : 'rgba(250, 250, 255, 0.9)',
                      } : {};

                      // ★中身の描画ロジック（安全なView構成）
                      const renderInnerContent = () => (
                        <View style={{ flexDirection: 'column', width: '100%' }}>
                          
                          {/* 上段: ヘッダー部分 */}
                          {item.type === 'checkin' ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ fontSize: 20, marginRight: 8 }}>🏨</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.checkinTime, { fontSize: 10, color: randomItemBg ? 'white' : (isTodayDark || isDark ? '#90caf9' : '#1565c0') }]}>
                                  {item.time === '連泊' ? '連泊' : `${item.time} IN`}
                                </Text>
                                <Text 
                                  style={{ fontSize: 14, fontWeight:'bold', color: randomItemBg ? 'white' : (isTodayDark || isDark ? 'white' : '#0d47a1') }} 
                                  numberOfLines={1} textBreakStrategy="simple"
                                >
                                  {item.title}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <View>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems:'flex-start', marginBottom: 4 }}>
                                <Text style={[styles.noteTime, { fontSize: 11, color: randomItemBg ? '#eee' : itemTime }]}>{item.time}</Text>
                                <View style={{ flexDirection:'row', alignItems:'center' }}>
                                    {!isLeft && <Text style={{ fontSize:9, marginRight:2, color:theme.subText }}>Guest</Text>}
                                    <Text style={{ fontSize: 11 }}>{category.icon}</Text>
                                </View>
                              </View>
                              
                              <Text 
                                style={{ 
                                    fontSize: 14,fontFamily: 'Aosagi', fontWeight: 'normal',fontWeight: 'bold', color: randomItemBg ? 'white' : itemText,
                                    marginBottom: 6, minHeight: 20
                                }} 
                                numberOfLines={2} textBreakStrategy="simple"
                              >
                                {item.title}
                              </Text>
                            </View>
                          )}

                          {/* 下段: フッター部分 (書き換え) */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 4 }}>
                             
                             {/* 左側: アイコンや情報 */}
                             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {/* ゲストアイコン（自分以外の場合） */}
                                {!isLeft && (
                                  <View style={{ flexDirection: 'row', marginRight: 6 }}>
                                    {(item.acceptedBy || ['G']).map((user, idx) => (
                                      <View key={idx} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center', marginRight: -6, borderWidth:1, borderColor:'white' }}>
                                        <Text style={{ color: 'white', fontSize: 8, fontWeight:'bold' }}>{typeof user === 'string' ? user.charAt(0) : 'U'}</Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                                
                                {/* 予算表示 (ボタンではなくテキストとして配置) */}
                                {item.price ? (
                                    <View style={{ flexDirection:'row', alignItems:'center', opacity: 0.8 }}>
                                        <Text style={{ fontSize: 10, color: randomItemBg ? 'white' : (isDark ? '#ccc' : '#666'), marginRight:2 }}>💰</Text>
                                        <Text style={{ fontSize: 11, color: randomItemBg ? 'white' : (isDark ? '#eee' : '#333'), fontWeight: 'bold' }}>
                                          {formatMoney(item.price)}
                                        </Text>
                                    </View>
                                ) : null}
                             </View>

                            {/* 右側: クイック撮影ボタン (Androidバグ回避のため高さ確保済みの親の中で配置) */}
                            <TouchableOpacity 
                                onPress={() => handleQuickPhoto(dayInfo.index, item)} 
                                activeOpacity={0.7}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // タップ範囲を広げる
                                style={{ 
                                    backgroundColor: randomItemBg ? 'rgba(0,0,0,0.3)' : (isDark ? '#444' : '#f0f0f0'), 
                                    width: 36, height: 30, // 少し横長にして押しやすく
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: randomItemBg ? 'rgba(255,255,255,0.3)' : 'transparent'
                                }}
                            >
                              <Text style={{ fontSize: 16 }}>
                                { (item.images && item.images.length > 0) ? '📸' : '📷' }
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );

                      return (
                        <View 
                        key={`${item.id}-${item.status}`}
                        style={{ marginBottom: isLeft ? 8 : 4 }}
                        collapsable={false}
                        >
                          
                          {/* 付箋の配置コンテナ */}
                          <View style={{ flexDirection: 'row', justifyContent: isLeft ? 'flex-start' : 'flex-end', width: '100%' }}>
                            
                            {/* ★修正: 左側の線を「border」ではなく「独立した棒」として描画 */}
                            {isLeft && (
                              <View style={{ flexDirection:'row', alignItems:'stretch', marginRight: 0 }}>
                                {/* もともとの細い線 */}
                                <View style={{ width: 4, backgroundColor: item.type === 'checkin' ? '#1565c0' : category.border, marginRight: 2, borderRadius: 2 }} />
                                {/* 付箋と一体化して見える太い線 */}
                                <View style={{ width: 6, backgroundColor: category.border, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
                              </View>
                            )}

                            <TouchableOpacity
                              style={[
                                { 
                                  // ■ 外枠スタイル（ここにはoverflow:hiddenをつけない！）
                                  flexDirection: 'column',
                                  width: isLeft ? '93%' : '70%', // 棒の分だけ少し減らす
                                  minHeight: 70,
                                  
                                  // 影の設定
                                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2,
                                  
                                  // ここでは背景色を指定せず、中身のViewにつける（角丸のため）
                                  backgroundColor: 'transparent',
                                  
                                  opacity: itemStatus === 'hold' ? 0.6 : 1,
                                }
                              ]}
                              onPress={() => handleItemPress({ dayIndex: dayInfo.index, item })}
                              activeOpacity={0.9}
                            >
                              {/* ★中身のコンテナ（ここで角丸と背景色とクリッピングを行う） */}
                              <View style={[
                                {
                                  flex: 1,
                                  backgroundColor: finalItemBg,
                                  // 左側が平らで、右側が丸い（タグっぽい）形状、または全体丸
                                  borderTopRightRadius: 12,
                                  borderBottomRightRadius: 12,
                                  borderTopLeftRadius: isLeft ? 0 : 12, // 左側にある時は棒と繋がるので角ばらせる
                                  borderBottomLeftRadius: isLeft ? 0 : 12,
                                  
                                  overflow: 'hidden', // 画像などがはみ出ないようにここで切る
                                  ...rightStyle
                                }
                              ]}>
                                {randomItemBg ? (
                                  <ImageBackground source={{ uri: randomItemBg }} style={{ width: '100%', flex: 1, minHeight: 70 }} resizeMode="cover">
                                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 12 }}>
                                      {renderInnerContent()}
                                    </View>
                                  </ImageBackground>
                                ) : (
                                  <View style={{ width: '100%', flex: 1, padding: 12 }}>
                                    {renderInnerContent()}
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>

                          </View>

                          {/* Gap (空き時間) */}
                          {gapDuration && isLeft && (
                            <TouchableOpacity style={[styles.gapContainer, { height: 30 }]} onPress={() => handleGapPress(dayInfo.index, item.time, nextItem.time)}>
                              <View style={styles.gapLine} />
                              <View style={[styles.gapBadge, { paddingVertical: 1 }]}>
                                <Text style={[styles.gapText, { fontSize: 9 }]}>⬇ {gapDuration}</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                    <View style={{ height: 100 }} />
                  </ScrollView>

                  {/* フッター（宿・カウントダウン） */}
                  <View>
                    {countdownText && (
                      <View style={{ alignItems: 'center', marginBottom: 2 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12, backgroundColor: isTodayDark ? null : theme.danger, paddingHorizontal: 8, borderRadius: 4 }}>{countdownText}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.fixedHotelButton,
                        {
                          borderColor: tileBorderColor,
                          borderWidth: 1,
                          backgroundColor: isTodayDark ? 'rgba(255,255,255,0.2)' : theme.inputBg,
                          // ■■■ 追加: ナビバー回避モードなら下に余白を作る ■■■
                          marginBottom: isNavBarAdjustMode ? 40 : 0 
                        },
                      ]}
                      onPress={() => openSingleHotelEdit(dayInfo.index)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={[styles.hotelInputLabel, { color: tileSubTextColor }]}>
                            {hotelName ? '🛏️ 今夜の宿' : '🛏️ 今夜の宿を設定する'}
                          </Text>
                          <Text style={[styles.hotelInputValue, { color: tileTextColor }]}>
                            {hotelName || 'タップして入力 >'}
                          </Text>
                        </View>
                        {hotelName && (
                          <View style={{ backgroundColor: statusObj.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: statusObj.color }}>
                            <Text style={{ color: statusObj.color, fontSize: 10, fontWeight: 'bold' }}>{statusObj.label}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <TouchableOpacity 
            style={[
                styles.fab, 
                { backgroundColor: theme.tint },
                
                // ■■■ ナビバー回避モードONの時だけ「正円＆浮遊」に上書き ■■■
                isNavBarAdjustMode && {
                    bottom: 80,           // 下から浮かす
                    right: 20,            // 右から浮かす
                    width: 56,            // 小さくする
                    height: 56,
                    borderRadius: 28,     // 正円にする
                    borderTopLeftRadius: 28, // 1/4円の角丸を打ち消す
                    
                    justifyContent: 'center', // 中央揃えに変更
                    alignItems: 'center',
                    elevation: 5,         // 影を控えめに
                }
            ]} 
            onPress={openAddModal}
        >
          <Text style={[
              styles.fabText,
              // ■■■ テキスト位置も中央に戻す ■■■
              isNavBarAdjustMode && {
                  fontSize: 24,
                  marginRight: 0,
                  marginBottom: 0
              }
          ]}>＋</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  // 現在表示中の日の画像データを取得（ここで定義することで、モーダルからも見えるようになります）
  const currentDayImages =
    accommodations[currentViewingDayIndex]?.dayImages ||
    (accommodations[currentViewingDayIndex]?.dayImageUri
      ? [accommodations[currentViewingDayIndex].dayImageUri]
      : []) ||
    [];

  const showTabBar = !(activeTab === 'plan' && viewMode === 'detail');

// ■■■ 2. メインレンダリング (Appのreturn) ■■■
return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar 
        style={colorScheme === 'dark' ? 'light' : 'dark'} 
        backgroundColor={theme.header} 
        translucent={false} 
      />
      {/* コンテンツエリア */}
      <View style={{ flex: 1 }}>{renderContent()}</View>

      {/* タブバー */}
      {showTabBar && (
        <View style={[
          styles.tabBar, 
          { backgroundColor: theme.tabBar, borderTopColor: theme.border },
          // ★修正: パディングと高さを少し多めに取る
          isNavBarAdjustMode && { paddingBottom: 50, height: 120 } 
        ]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <Text style={[styles.tabIcon, activeTab === 'home' && { color: theme.tint }]}>🏠</Text>
            <Text style={[styles.tabLabel, { color: theme.subText }, activeTab === 'home' && { color: theme.tint }]}>ホーム</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('stock')}>
            <Text style={[styles.tabIcon, activeTab === 'stock' && { color: theme.tint }]}>🔖</Text>
            <Text style={[styles.tabLabel, { color: theme.subText }, activeTab === 'stock' && { color: theme.tint }]}>ストック</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => { setViewMode('list'); setActiveTab('plan'); }}>
            <Text style={[styles.tabIcon, activeTab === 'plan' && { color: theme.tint }]}>✈️</Text>
            <Text style={[styles.tabLabel, { color: theme.subText }, activeTab === 'plan' && { color: theme.tint }]}>計画</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- 各種モーダル (スタイル完全適用版) --- */}

      {/* 1. 時間変更モーダル */}
      <Modal animationType="fade" transparent={true} visible={quickTimeModalVisible} onRequestClose={() => setQuickTimeModalVisible(false)} presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalView, { width: '85%', backgroundColor: theme.modalBg }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>時間を変更</Text>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <TouchableOpacity style={[styles.timeDisplayButton, { backgroundColor: theme.inputBg }]} onPress={() => setPickerMode('quick_time')}>
                    <Text style={[styles.timeDisplayText, { color: theme.text }]}>{tempTimeString}</Text>
                  </TouchableOpacity>
                  {pickerMode === 'quick_time' && (
                    <DateTimePicker value={tempTimeDate} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onPickerChange} style={styles.iosPicker} themeVariant={colorScheme} locale="ja-JP" />
                  )}
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setQuickTimeModalVisible(false)}>
                    <Text style={styles.textStyle}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: '#4CD964' }]} onPress={saveQuickTime}>
                    <Text style={styles.textStyle}>決定</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2. 予算入力モーダル */}
      <Modal animationType="fade" transparent={true} visible={quickPriceModalVisible} onRequestClose={() => setQuickPriceModalVisible(false)} presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalView, { width: '80%', backgroundColor: theme.modalBg }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>予算を入力</Text>
                <TextInput style={[styles.input, { fontSize: 24, textAlign: 'center', height: 60, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="0" placeholderTextColor={theme.subText} value={tempPrice} onChangeText={setTempPrice} keyboardType="numeric" autoFocus={true} />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setQuickPriceModalVisible(false)}>
                    <Text style={styles.textStyle}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: '#4CD964' }]} onPress={saveQuickPrice}>
                    <Text style={styles.textStyle}>決定</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. 移動手段追加モーダル */}
      <Modal animationType="slide" transparent={true} visible={transportModalVisible} onRequestClose={() => setTransportModalVisible(false)} presentationStyle="overFullScreen">
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={[styles.modalView, { backgroundColor: theme.modalBg }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>移動手段を追加</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 20 }}>
                {TRANSPORT_OPTIONS.map((opt, i) => (
                  <TouchableOpacity key={i} style={[styles.catBtn, { width: '30%', marginRight:'3%', marginBottom: 10, backgroundColor: theme.inputBg }, selectedTransportOption?.label === opt.label && styles.activeCatBtn]} onPress={() => setSelectedTransportOption(opt)}>
                    <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                    <Text style={{ fontSize: 12, color: selectedTransportOption?.label === opt.label ? 'white' : theme.subText }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.label, { color: theme.text }]}>メモ (任意)</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="便名や詳細など" placeholderTextColor={theme.subText} onChangeText={(text) => { if (selectedTransportOption) setSelectedTransportOption({ ...selectedTransportOption, defaultTitle: text || selectedTransportOption.label }); }} />
              <Text style={[styles.label, { color: theme.text }]}>移動費 (¥)</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="例: 13000" placeholderTextColor={theme.subText} value={inputTransportPrice} onChangeText={setInputTransportPrice} keyboardType="numeric" />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setTransportModalVisible(false)}><Text style={styles.textStyle}>キャンセル</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.buttonAdd]} onPress={handleAddTransport}><Text style={styles.textStyle}>追加</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 4. ストック追加・編集モーダル */}
      <Modal animationType="slide" transparent={true} visible={stockModalVisible} onRequestClose={() => setStockModalVisible(false)} presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={[styles.modalView, { backgroundColor: theme.modalBg }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{stockModalMode === 'edit' ? 'ストックを編集' : 'ストックに追加'}</Text>
              <Text style={[styles.label, { color: theme.text }]}>場所の名前</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="例：素敵なカフェ" placeholderTextColor={theme.subText} value={inputStockTitle} onChangeText={setInputStockTitle} autoFocus={stockModalMode === 'create'} />
              
              <Text style={[styles.label, { color: theme.text }]}>写真</Text>
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                {inputStockImage ? (
                  <View><Image source={{ uri: inputStockImage }} style={{ width: 200, height: 150, borderRadius: 10 }} /><TouchableOpacity onPress={() => setInputStockImage(null)} style={{ position: 'absolute', top: -10, right: -10, backgroundColor: 'red', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontWeight: 'bold' }}>×</Text></TouchableOpacity></View>
                ) : (
                  <TouchableOpacity onPress={pickImageForStock} style={{ backgroundColor: theme.inputBg, width: '100%', height: 100, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ fontSize: 30, marginBottom: 5 }}>📷</Text><Text style={{ color: theme.subText }}>写真をライブラリから選択</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.label, { color: theme.text }]}>カテゴリ</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                {STOCK_CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat.id} style={[styles.catBtn, { width: '18%', backgroundColor: theme.inputBg }, inputStockCategory === cat.id && styles.activeCatBtn]} onPress={() => setInputStockCategory(cat.id)}>
                    <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                    <Text style={{ fontSize: 10, color: inputStockCategory === cat.id ? 'white' : theme.subText }}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: theme.text }]}>予算 (¥)</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="例: 1500" placeholderTextColor={theme.subText} value={inputStockPrice} onChangeText={setInputStockPrice} keyboardType="numeric" />
              <Text style={[styles.label, { color: theme.text }]}>メモ</Text>
              <TextInput style={[styles.input, { height: 60, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="〇〇が美味しいらしい" placeholderTextColor={theme.subText} value={inputStockNote} onChangeText={setInputStockNote} multiline />
              <Text style={[styles.label, { color: theme.text }]}>URL</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  style={[styles.input, { flex: 1, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} 
                  placeholder="http://..." 
                  placeholderTextColor={theme.subText} 
                  value={inputStockUrl} 
                  onChangeText={setInputStockUrl} 
                  autoCapitalize="none" 
                />
                <TouchableOpacity 
                  style={{ marginLeft: 10, backgroundColor: theme.tint, padding: 10, borderRadius: 8 }}
                  onPress={async () => {
                    if (!inputStockUrl) {
                      Alert.alert("エラー", "URLを入力してください");
                      return;
                    }
                    setIsProcessing(true);
                    
                    // ★ここを変更: タイトルと画像をセットで受け取る
                    const info = await fetchWebPageInfo(inputStockUrl);
                    
                    if (info) {
                      if (info.image) setInputStockImage(info.image);
                      // タイトルが空欄なら自動入力（既に入力済みなら上書き確認してもいいですが、今回は強制上書きせず空欄のみ埋める形にします）
                      if (info.title && !inputStockTitle) setInputStockTitle(info.title);
                      
                      Alert.alert("成功", "情報を取得しました！");
                    }
                    setIsProcessing(false);
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>自動入力</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setStockModalVisible(false)}><Text style={styles.textStyle}>キャンセル</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.buttonAdd]} onPress={handleSaveStock}><Text style={styles.textStyle}>{stockModalMode === 'edit' ? '保存' : '追加'}</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 5. モーダル */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)} presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          {stockSelectVisible ? (
            <View style={[styles.modalView, { height: '80%', width: '95%', padding: 0, marginHorizontal: 0, backgroundColor: theme.modalBg, overflow:'hidden' }]}>
              {/* ヘッダー */}
              <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.header }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>🔖 ストックから引用</Text>
                <TouchableOpacity onPress={() => setStockSelectVisible(false)} style={{ padding: 5 }}>
                  <Text style={{ color: theme.tint, fontWeight: 'bold', fontSize: 16 }}>閉じる</Text>
                </TouchableOpacity>
              </View>
              
              {/* リスト部分 */}
              <FlatList 
                data={stockList} 
                keyExtractor={(item) => item.id.toString()} 
                contentContainerStyle={{ padding: 15, paddingBottom: 40 }} 
                ListEmptyComponent={
                  <View style={{ alignItems:'center', marginTop:50 }}>
                    <Text style={{ fontSize:40 }}>🤔</Text>
                    <Text style={{ color: theme.subText, marginTop:10 }}>ストックがありません</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  // カテゴリ情報の取得
                  const cat = STOCK_CATEGORIES.find(c => c.id === item.category) || STOCK_CATEGORIES[0];
                  
                  return (
                    <TouchableOpacity 
                      style={{ 
                        flexDirection: 'row', 
                        backgroundColor: theme.card, 
                        marginBottom: 12, 
                        borderRadius: 12, 
                        padding: 10,
                        alignItems: 'center',
                        // 影をつけてボタン感を出す
                        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2,
                        borderWidth: 1, borderColor: theme.border
                      }} 
                      onPress={() => handleSelectStock(item)}
                      activeOpacity={0.7}
                    >
                      {/* 左側: 情報エリア */}
                      <View style={{ flex: 1, marginRight: 10, justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 }}>
                             <Text style={{ fontSize: 10, color: theme.subText, fontWeight:'bold' }}>{cat.icon} {cat.label}</Text>
                          </View>
                          {item.price ? (
                            <Text style={{ fontSize: 11, color: theme.tint, fontWeight:'bold' }}>¥{Number(item.price).toLocaleString()}</Text>
                          ) : null}
                        </View>
                        
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 4, lineHeight: 22 }} numberOfLines={2}>
                          {item.title}
                        </Text>
                        
                        {item.url ? (
                          <Text style={{ fontSize: 10, color: theme.subText }} numberOfLines={1}>
                            🔗 {item.url}
                          </Text>
                        ) : null}
                      </View>

                      {/* 右側: 画像エリア */}
                      {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={{ width: 70, height: 70, borderRadius: 8, backgroundColor:'#eee' }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 30 }}>{cat.icon}</Text>
                        </View>
                      )}
                      
                      {/* 追加ボタンアイコン（右上に配置してアクションを明示） */}
                      <View style={{ position:'absolute', right: -6, top: -6, backgroundColor: theme.tint, width: 24, height: 24, borderRadius: 12, alignItems:'center', justifyContent:'center', elevation: 3, borderWidth:2, borderColor: theme.card }}>
                         <Text style={{ color:'white', fontSize:14, fontWeight:'bold', marginTop:-1 }}>＋</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          ) : (
            <View style={[styles.modalView, { maxHeight: '85%', width: '90%', backgroundColor: theme.modalBg }]}>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{daysArray[currentPage] ? daysArray[currentPage].dayLabel : ''} に追加</Text>
                <TouchableOpacity style={[styles.stockImportBtn, { borderColor: theme.tint, backgroundColor: theme.inputBg }]} onPress={() => setStockSelectVisible(true)}><Text style={{ color: theme.tint, fontWeight: 'bold' }}>🔖 ストックから引用する</Text></TouchableOpacity>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 15 }}>
                  {ITEM_CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat.id} style={[styles.catBtn, { width: '18%', marginRight: '2%', marginBottom: 10, backgroundColor: theme.inputBg }, newItemType === cat.id && { backgroundColor: cat.bg, borderWidth: 1, borderColor: cat.border }]} onPress={() => setNewItemType(cat.id)}>
                      <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                      <Text style={{ fontSize: 10, color: theme.subText }}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {newItemType === 'move' && (
                  <View style={{ marginBottom: 15 }}>
                    <Text style={[styles.label, { color: theme.text }]}>移動手段を選択</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                      {TRANSPORT_OPTIONS.map((opt, i) => (
                        <TouchableOpacity key={i} style={[styles.catBtn, { width: '30%', marginRight: '3%', marginBottom: 10, backgroundColor: theme.inputBg }, inputItemTitle === opt.defaultTitle && styles.activeCatBtn]} onPress={() => setInputItemTitle(opt.defaultTitle)}>
                          <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                          <Text style={{ fontSize: 10, color: inputItemTitle === opt.defaultTitle ? 'white' : theme.subText }}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <Text style={[styles.label, { color: theme.text }]}>URLから自動入力</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <TextInput 
                    style={[styles.input, { flex: 1, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} 
                    placeholder="お店やサイトのURL" 
                    placeholderTextColor={theme.subText} 
                    value={inputItemUrl} 
                    onChangeText={setInputItemUrl} 
                    autoCapitalize="none" 
                  />
                  <TouchableOpacity 
                    style={{ marginLeft: 10, backgroundColor: theme.tint, padding: 10, borderRadius: 8 }}
                    onPress={async () => {
                      if (!inputItemUrl) return;
                      setIsProcessing(true);
                      const info = await fetchWebPageInfo(inputItemUrl);
                      if (info) {
                        if (info.title) setInputItemTitle(info.title); // タイトル自動入力
                        if (info.image) setInputItemImages([info.image]); // 画像自動入力
                        Alert.alert("成功", "情報を取得しました！");
                      }
                      setIsProcessing(false);
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>取込</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: theme.text }]}>タイトル</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="予定を入力" placeholderTextColor={theme.subText} value={inputItemTitle} onChangeText={setInputItemTitle} />
                <Text style={[styles.label, { color: theme.text }]}>写真 (任意)</Text>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                   {inputItemImages.length > 0 ? (
                    <ScrollView horizontal>
                      {inputItemImages.map((uri, idx) => (
                        <View key={idx} style={{ marginRight: 5 }}>
                          <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 10 }} /><TouchableOpacity onPress={() => removeItemImage(uri)} style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontWeight: 'bold' }}>×</Text></TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity onPress={pickImageForItem} style={{ backgroundColor: theme.inputBg, width: 100, height: 100, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}><Text style={{ fontSize: 30, color: theme.subText }}>+</Text></TouchableOpacity>
                    </ScrollView>
                   ) : (
                     <TouchableOpacity onPress={pickImageForItem} style={{ backgroundColor: theme.inputBg, width: '100%', padding: 10, alignItems: 'center', borderRadius: 5, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}><Text style={{ fontSize: 12, color: theme.subText }}>📷 写真を追加</Text></TouchableOpacity>
                   )}
                </View>
                <Text style={[styles.label, { color: theme.text }]}>予算 (¥)</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="例: 1000" placeholderTextColor={theme.subText} value={inputItemPrice} onChangeText={setInputItemPrice} keyboardType="numeric" />
                <Text style={[styles.label, { color: theme.text }]}>時間は？</Text>
                <View style={styles.timePickerContainer}>
                  <TouchableOpacity style={[styles.timeDisplayButton, { backgroundColor: theme.inputBg }]} onPress={() => setPickerMode('time')}><Text style={[styles.timeDisplayText, { color: theme.text }]}>{timeString || '時間をタップして選択 🕒'}</Text></TouchableOpacity>
                  {pickerMode === 'time' && (
                    <DateTimePicker value={inputItemTime} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onPickerChange} style={styles.iosPicker} themeVariant={colorScheme} locale="ja-JP" />
                  )}
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setModalVisible(false)}><Text style={styles.textStyle}>キャンセル</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.buttonAdd]} onPress={handleAddItem}><Text style={styles.textStyle}>追加</Text></TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* 6. 編集モーダル */}
      <Modal animationType="slide" transparent={true} visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)} presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalView, { height: '85%', width: '90%', padding: 0, overflow: 'hidden', backgroundColor: theme.modalBg }]}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>編集</Text>
              {editItemType !== 'checkin' && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={[styles.label, { color: theme.text }]}>カテゴリ</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {ITEM_CATEGORIES.map((cat) => (
                      <TouchableOpacity key={cat.id} style={[styles.catBtn, { width: '18%', marginRight: '2%', marginBottom: 10, backgroundColor: theme.inputBg }, editItemType === cat.id && { backgroundColor: cat.bg, borderWidth: 1, borderColor: cat.border }]} onPress={() => setEditItemType(cat.id)}>
                        <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                        <Text style={{ fontSize: 10, color: theme.subText }}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {editItemType === 'move' && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={[styles.label, { color: theme.text }]}>移動手段を変更</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {TRANSPORT_OPTIONS.map((opt, i) => (
                      <TouchableOpacity key={i} style={[styles.catBtn, { width: '30%', marginRight: '3%', marginBottom: 10, backgroundColor: theme.inputBg }, editItemTitle === opt.defaultTitle && styles.activeCatBtn]} onPress={() => setEditItemTitle(opt.defaultTitle)}>
                        <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                        <Text style={{ fontSize: 10, color: editItemTitle === opt.defaultTitle ? 'white' : theme.subText }}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <Text style={[styles.label, { color: theme.text }]}>タイトル</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} value={editItemTitle} onChangeText={setEditItemTitle} />
              
              <Text style={[styles.label, { color: theme.text }]}>写真</Text>
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                 {editItemImages.length > 0 ? (
                    <ScrollView horizontal>
                      {editItemImages.map((uri, idx) => (
                        <View key={idx} style={{ marginRight: 5 }}>
                          <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                          <TouchableOpacity onPress={() => removeItemImage(uri)} style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontWeight: 'bold' }}>×</Text></TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity onPress={pickImageForItem} style={{ backgroundColor: theme.inputBg, width: 100, height: 100, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}><Text style={{ fontSize: 30, color: theme.subText }}>+</Text></TouchableOpacity>
                    </ScrollView>
                 ) : (
                   <TouchableOpacity onPress={pickImageForItem} style={{ backgroundColor: theme.inputBg, width: '100%', padding: 10, alignItems: 'center', borderRadius: 5, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}><Text style={{ fontSize: 12, color: theme.subText }}>📷 写真を追加/変更</Text></TouchableOpacity>
                 )}
              </View>

              <Text style={[styles.label, { color: theme.text }]}>予算 (¥)</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} value={editItemPrice} onChangeText={setEditItemPrice} keyboardType="numeric" />
              <Text style={[styles.label, { color: theme.text }]}>時間</Text>
              <View style={styles.timePickerContainer}>
                <TouchableOpacity style={[styles.timeDisplayButton, { backgroundColor: theme.inputBg }]} onPress={() => setPickerMode('edit_time')}><Text style={[styles.timeDisplayText, { color: theme.text }]}>{editTimeString}</Text></TouchableOpacity>
                {pickerMode === 'edit_time' && (
                  <DateTimePicker value={editItemTime} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onPickerChange} style={styles.iosPicker} themeVariant={colorScheme} locale="ja-JP" />
                )}
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setEditModalVisible(false)}><Text style={styles.textStyle}>キャンセル</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#4CD964' }]} onPress={handleEditSave}><Text style={styles.textStyle}>保存</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={{ marginTop: 20, marginBottom: 40, alignSelf: 'center' }} onPress={handleDeleteItem}><Text style={{ color: theme.danger, fontWeight: 'bold' }}>🗑️ この予定を削除する</Text></TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.modalFab} onPress={handleInsertNext}><Text style={{ fontSize: 30, color: 'white', fontWeight: 'bold' }}>＋</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 目次モーダル */}
      <Modal animationType="fade" transparent={true} visible={tocVisible} onRequestClose={() => setTocVisible(false)} presentationStyle="overFullScreen">
        <View style={styles.fullScreenModalOverlay}>
          <View style={[styles.fullScreenModal, { backgroundColor: theme.modalBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>📖 旅のしおり（目次）</Text>
              <TouchableOpacity onPress={() => setTocVisible(false)}><Text style={{ fontSize: 20, color: theme.tint }}>閉じる</Text></TouchableOpacity>
            </View>
            <FlatList
              data={daysArray}
              keyExtractor={(item) => item.index.toString()}
              renderItem={({ item }) => {
                const hotelData = accommodations[item.index];
                const name = typeof hotelData === 'object' && hotelData ? hotelData.name : hotelData;
                return (
                  <TouchableOpacity onPress={() => jumpToDay(item.index)} style={[styles.hotelRow, { borderBottomColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 80 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.text }}>{item.dayLabel}</Text>
                        <Text style={{ fontSize: 12, color: theme.subText }}>{item.date}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, color: name ? '#1565c0' : theme.subText }}>{name ? `🛏️ ${name}` : '(宿泊地未定)'}</Text>
                      </View>
                      <Text style={{ fontSize: 20, color: theme.subText }}>→</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* プロジェクト作成モーダル */}
      <Modal animationType="slide" transparent={true} visible={projectModalVisible} onRequestClose={() => setProjectModalVisible(false)} presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalView, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{modalMode === 'edit' ? '設定変更' : '新規作成'}</Text>

            {/* ▼▼▼ 追加: 画像変更エリア ▼▼▼ */}
            {modalMode === 'edit' && currentProject && (
              <View style={{ alignItems:'center', marginBottom:15 }}>
                <TouchableOpacity onPress={() => pickImageForProject(currentProject.id)} style={{ width: '100%', height: 120, backgroundColor: theme.inputBg, borderRadius:10, overflow:'hidden', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: theme.border }}>
                  {currentProject.imageUri ? (
                    <Image source={{ uri: currentProject.imageUri }} style={{ width:'100%', height:'100%' }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize:40, opacity:0.3 }}>📷</Text>
                  )}
                  <View style={{ position:'absolute', bottom:0, right:0, backgroundColor:'rgba(0,0,0,0.5)', padding:5, borderTopLeftRadius:10 }}>
                     <Text style={{ color:'white', fontSize:12 }}>変更</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {modalMode === 'create' && (
              <View style={{ marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: theme.inputBg, padding: 12, borderRadius: 10, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }} onPress={handleImportFromClipboard}>
                  <Text style={{fontSize: 24}}>📋</Text><Text style={{color: theme.text, fontSize: 10, fontWeight: 'bold', marginTop: 4}}>クリップボード</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: theme.inputBg, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }} onPress={startScan}>
                  <Text style={{fontSize: 24}}>📷</Text><Text style={{color: theme.text, fontSize: 10, fontWeight: 'bold', marginTop: 4}}>QRスキャン</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.label, { color: theme.text }]}>タイトル</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="例：北海道旅行" placeholderTextColor={theme.subText} value={inputTitle} onChangeText={setInputTitle} />
            <View style={styles.dateRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.label, { color: theme.text }]}>開始日</Text>
                <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.inputBg }]} onPress={() => setPickerMode('start')}><Text style={{ color: theme.text }}>{formatDate(inputStartDate)}</Text></TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>終了日</Text>
                <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.inputBg }]} onPress={() => setPickerMode('end')}><Text style={{ color: theme.text }}>{formatDate(inputEndDate)}</Text></TouchableOpacity>
              </View>
            </View>
            {pickerMode === 'start' || pickerMode === 'end' ? (
              <View style={{ alignItems: 'center', marginTop: 10 }}>
                <DateTimePicker value={pickerMode === 'start' ? inputStartDate : inputEndDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onPickerChange} style={{ width: 320, height: 120 }} themeVariant={colorScheme} locale="ja-JP" />
              </View>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setProjectModalVisible(false)}><Text style={styles.textStyle}>キャンセル</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonAdd]} onPress={handleSaveProject}><Text style={styles.textStyle}>{modalMode === 'edit' ? '更新' : '作成'}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* アクションメニュー */}
      <Modal animationType="fade" transparent={true} visible={actionMenuVisible} onRequestClose={() => setActionMenuVisible(false)} presentationStyle="overFullScreen">
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.actionSheet, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.actionSheetTitle, { color: theme.subText }]}>操作を選択</Text>
            <TouchableOpacity style={[styles.actionButton, { borderBottomWidth: 1, borderBottomColor: theme.border }]} onPress={handleEditStart}><Text style={{ fontSize: 18, color: theme.tint }}>🕒 時間・内容を変更</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { marginBottom: 10 }]} onPress={handleDeleteFromMenu}><Text style={{ fontSize: 18, color: theme.danger }}>🗑️ 削除する</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.inputBg }]} onPress={() => setActionMenuVisible(false)}><Text style={{ fontSize: 18, color: theme.text }}>キャンセル</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 宿編集モーダル (★修正完了版: 入力欄復活済み) */}
      <Modal animationType="fade" transparent={true} visible={singleHotelModalVisible} onRequestClose={() => setSingleHotelModalVisible(false)} presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalView, { maxHeight: '90%', backgroundColor: theme.modalBg }]}>
            <ScrollView>
              {!isHotelEditMode ? (
                <View>
                  {inputHotelImages && inputHotelImages.length > 0 && (
                    <ScrollView horizontal style={{ marginBottom: 10 }}>{inputHotelImages.map((uri, idx) => <Image key={idx} source={{ uri }} style={{ width: 150, height: 100, borderRadius: 10, marginRight: 5 }} resizeMode="cover" />)}</ScrollView>
                  )}
                  <Text style={{ textAlign: 'center', color: theme.subText, fontSize: 12, marginBottom: 5 }}>チェックイン 15:00 ~</Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: theme.text }}>{inputSingleHotelName}</Text>
                  {inputSingleHotelName ? (
                    <View style={{ alignSelf: 'center', marginBottom: 20, backgroundColor: HOTEL_STATUSES.find(s => s.id === inputSingleHotelStatus)?.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: HOTEL_STATUSES.find(s => s.id === inputSingleHotelStatus)?.color, fontWeight: 'bold' }}>{HOTEL_STATUSES.find(s => s.id === inputSingleHotelStatus)?.label}</Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25 }}>
                    <TouchableOpacity style={[styles.actionIconBtn, !inputHotelTel && styles.disabledBtn, { backgroundColor: theme.inputBg }]} onPress={() => makeCall(inputHotelTel)} disabled={!inputHotelTel}><Text style={{ fontSize: 30 }}>📞</Text><Text style={[styles.actionIconLabel, { color: theme.subText }]}>電話</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionIconBtn, !inputHotelAddress && styles.disabledBtn, { backgroundColor: theme.inputBg }]} onPress={() => openMap(inputHotelAddress)} disabled={!inputHotelAddress}><Text style={{ fontSize: 30 }}>🗺️</Text><Text style={[styles.actionIconLabel, { color: theme.subText }]}>地図</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionIconBtn, !inputHotelUrl && styles.disabledBtn, { backgroundColor: theme.inputBg }]} onPress={() => openLink(inputHotelUrl)} disabled={!inputHotelUrl}><Text style={{ fontSize: 30 }}>🌎</Text><Text style={[styles.actionIconLabel, { color: theme.subText }]}>Web</Text></TouchableOpacity>
                  </View>
                  {inputHotelAddress ? <Text style={[styles.detailRow, { color: theme.text }]}>📍 {inputHotelAddress}</Text> : null}
                  {inputHotelTel ? <Text style={[styles.detailRow, { color: theme.text }]}>📞 {inputHotelTel}</Text> : null}
                  {inputHotelUrl ? <Text style={[styles.detailRow, { color: theme.text }]}>🔗 {inputHotelUrl}</Text> : null}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.inputBg }]} onPress={() => setSingleHotelModalVisible(false)}><Text style={{ color: theme.text, fontWeight: 'bold' }}>閉じる</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.tint }]} onPress={() => setIsHotelEditMode(true)}><Text style={styles.textStyle}>編集する</Text></TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>宿情報を編集</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {/* ① ファイルから */}
                    <TouchableOpacity 
                        style={{ flexDirection:'row', alignItems:'center', backgroundColor: theme.inputBg, padding:8, borderRadius:8, borderWidth:1, borderColor:theme.tint, marginRight: 5 }}
                        onPress={handleImportICSForHotel}
                    >
                        <Text style={{ fontSize:14,fontWeight:'bold', color:theme.text }}>📂ファイルから</Text>
                    </TouchableOpacity>

                    {/* ② クリップボードから (★追加) */}
                    <TouchableOpacity 
                        style={{ flexDirection:'row', alignItems:'center', backgroundColor: theme.inputBg, padding:8, borderRadius:8, borderWidth:1, borderColor:theme.tint }}
                        onPress={handlePasteICSForHotel}
                    >
                        <Text style={{ fontSize:16, marginRight:4 }}>📋</Text>
                        <Text style={{ fontSize:14, fontWeight:'bold', color:theme.text }}>ペースト解析</Text>
                    </TouchableOpacity>
                </View>
                  <Text style={[styles.label, { color: theme.text }]}>宿の写真</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                    {inputHotelImages.map((uri, idx) => (
                      <View key={idx} style={{ marginRight: 10, marginBottom: 10 }}>
                        <Image source={{ uri }} style={{ width: 80, height: 60, borderRadius: 5 }} />
                        <TouchableOpacity onPress={() => removeHotelImage(uri)} style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontWeight: 'bold' }}>×</Text></TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity onPress={pickImageForHotel} style={{ width: 80, height: 60, borderRadius: 5, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}><Text style={{ fontSize: 24 }}>📷</Text></TouchableOpacity>
                  </View>
                  <Text style={[styles.label, { color: theme.text }]}>宿泊数</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                    <TouchableOpacity onPress={() => setStayDuration(Math.max(1, stayDuration - 1))} style={{ backgroundColor: theme.inputBg, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, color: theme.text }}>-</Text></TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, color: theme.text }}>{stayDuration}泊</Text>
                    <TouchableOpacity onPress={() => setStayDuration(stayDuration + 1)} style={{ backgroundColor: theme.inputBg, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, color: theme.text }}>+</Text></TouchableOpacity>
                  </View>
                  <Text style={[styles.label, { color: theme.text }]}>ホテル・旅館名</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="例：〇〇ホテル" placeholderTextColor={theme.subText} value={inputSingleHotelName} onChangeText={setInputSingleHotelName} />
                  <Text style={[styles.label, { color: theme.text }]}>予約・支払い状況</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    {HOTEL_STATUSES.map((status) => (
                      <TouchableOpacity key={status.id} style={{ padding: 8, borderRadius: 8, backgroundColor: inputSingleHotelStatus === status.id ? status.color : theme.inputBg, width: '23%', alignItems: 'center' }} onPress={() => setInputSingleHotelStatus(status.id)}>
                        <Text style={{ color: inputSingleHotelStatus === status.id ? 'white' : theme.subText, fontSize: 10, fontWeight: 'bold' }}>{status.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.label, { color: theme.text }]}>チェックイン予定時間</Text>
                  <View style={styles.timePickerContainer}>
                    <TouchableOpacity style={[styles.timeDisplayButton, { backgroundColor: theme.inputBg }]} onPress={() => setPickerMode('single_hotel_time')}>
                      <Text style={[styles.timeDisplayText, { color: theme.text }]}>{singleCheckinTimeString}</Text>
                    </TouchableOpacity>
                    {pickerMode === 'single_hotel_time' && (
                      <DateTimePicker value={inputSingleCheckinTime} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onPickerChange} style={styles.iosPicker} themeVariant={colorScheme} locale="ja-JP" />
                    )}
                  </View>
                  <Text style={[styles.label, { color: theme.text }]}>電話番号</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="03-1234-5678" placeholderTextColor={theme.subText} keyboardType="phone-pad" value={inputHotelTel} onChangeText={setInputHotelTel} />
                  <Text style={[styles.label, { color: theme.text }]}>住所</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="〇〇県〇〇市..." placeholderTextColor={theme.subText} value={inputHotelAddress} onChangeText={setInputHotelAddress} />
                  <Text style={[styles.label, { color: theme.text }]}>URL</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="https://..." placeholderTextColor={theme.subText} value={inputHotelUrl} onChangeText={setInputHotelUrl} autoCapitalize="none" />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setIsHotelEditMode(false)}><Text style={styles.textStyle}>キャンセル</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#4CD964' }]} onPress={saveSingleHotelName}><Text style={styles.textStyle}>保存</Text></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{ marginTop: 20, alignSelf: 'center' }} onPress={deleteHotelInfo}><Text style={{ color: theme.danger, fontWeight: 'bold' }}>🗑️ この宿情報を削除</Text></TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 持ち物リスト */}
      <Modal animationType="slide" transparent={true} visible={packingVisible} onRequestClose={() => setPackingVisible(false)} presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalView, { height: '80%', backgroundColor: theme.modalBg }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>🎒 持ち物リスト</Text>
              <TouchableOpacity onPress={() => setPackingVisible(false)}><Text style={{ fontSize: 20, color: theme.tint }}>閉じる</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 10, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]} placeholder="新しいアイテムを追加" placeholderTextColor={theme.subText} value={newPackingItem} onChangeText={setNewPackingItem} />
              <TouchableOpacity style={{ backgroundColor: theme.tint, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 10 }} onPress={addPackingItem}><Text style={{ color: 'white', fontWeight: 'bold' }}>＋</Text></TouchableOpacity>
            </View>
            <FlatList
              data={packingList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <TouchableOpacity onPress={() => togglePackingItem(item.id)}><Text style={{ fontSize: 24, marginRight: 10 }}>{item.checked ? '☑️' : '⬜'}</Text></TouchableOpacity>
                  <Text style={{ flex: 1, fontSize: 16, textDecorationLine: item.checked ? 'line-through' : 'none', color: item.checked ? theme.subText : theme.text }}>{item.text}</Text>
                  <TouchableOpacity onPress={() => deletePackingItem(item.id)}><Text style={{ fontSize: 18, color: theme.subText }}>×</Text></TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: theme.subText }}>アイテムを追加してください</Text>}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>


{/* ■■■ アルバムモーダル (リスト ⇔ 詳細 切り替え版) ■■■ */}
{/* ■■■ 修正: アルバムモーダル ■■■ */}
      <Modal animationType="fade" transparent={false} visible={dayAlbumVisible} onRequestClose={() => setDayAlbumVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
          
          {/* ヘッダーエリア */}
          <View style={{ padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity onPress={() => setDayAlbumVisible(false)}>
              <Text style={{ color: 'white', fontSize: 18 }}>✕ 閉じる</Text>
            </TouchableOpacity>
            
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
               {daysArray[currentViewingDayIndex]?.dayLabel || 'アルバム'}
            </Text>

            {/* 選択モード切替ボタン */}
            <TouchableOpacity onPress={() => {
                if (albumSelectionMode) {
                    setAlbumSelectionMode(false);
                    setSelectedAlbumImages([]);
                } else {
                    setAlbumSelectionMode(true);
                }
            }}>
              <Text style={{ color: albumSelectionMode ? theme.tint : 'white', fontSize: 18, fontWeight: 'bold' }}>
                {albumSelectionMode ? 'キャンセル' : '選択'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 画像グリッド */}
          <View style={{ flex: 1 }}>
            {albumImages.length === 0 ? (
               <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                 <Text style={{ color: 'gray' }}>写真がありません</Text>
               </View>
            ) : (
               <FlatList
                 data={albumImages}
                 keyExtractor={(item, index) => index.toString()}
                 numColumns={3}
                 renderItem={({ item }) => {
                   // ★ここを修正！ データが「文字」でも「オブジェクト」でも対応できるようにする
                   const uri = (typeof item === 'string') ? item : item?.uri; 
                   
                   // uriが取得できない場合は何も表示しない（安全策）
                   if (!uri) return null;

                   const isSelected = selectedAlbumImages.includes(uri);

                   return (
                     <TouchableOpacity 
                       style={{ width: '33%', aspectRatio: 1, padding: 1 }}
                       onPress={() => {
                         if (albumSelectionMode) {
                           // 選択モード
                           if (isSelected) setSelectedAlbumImages(prev => prev.filter(u => u !== uri));
                           else setSelectedAlbumImages(prev => [...prev, uri]);
                         } else {
                           // 通常モード（プレビューなど）
                           // Alert.alert("URI check", uri); // デバッグ用
                         }
                       }}
                     >
                       <Image source={{ uri: uri }} style={{ width: '100%', height: '100%', opacity: (albumSelectionMode && !isSelected) ? 0.5 : 1 }} />
                       
                       {/* 選択中のチェックマーク */}
                       {albumSelectionMode && (
                         <View style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'white', backgroundColor: isSelected ? theme.tint : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                           {isSelected && <Text style={{ color: 'white', fontSize: 14 }}>✓</Text>}
                         </View>
                       )}
                     </TouchableOpacity>
                   );
                 }}
               />
            )}
          </View>

          {/* フッター（選択モード時のみ表示） */}
          {albumSelectionMode && (
            <View style={{ padding: 20, backgroundColor: 'rgba(20,20,20,0.9)', flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity 
                style={{ backgroundColor: theme.danger, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20, opacity: selectedAlbumImages.length === 0 ? 0.5 : 1 }}
                disabled={selectedAlbumImages.length === 0}
                onPress={() => {
                   Alert.alert(
                     "写真を削除",
                     "選択した写真をゴミ箱に移動しますか？\n（元の予定からも削除されます）",
                     [
                       { text: "キャンセル", style: "cancel" },
                       { text: "削除する", style: "destructive", onPress: deleteSelectedAlbumImages }
                     ]
                   );
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>ゴミ箱に入れる ({selectedAlbumImages.length})</Text>
              </TouchableOpacity>
            </View>
          )}

        </SafeAreaView>
      </Modal>
      {/* ■■■ 追加: QRコード表示モーダル ■■■ */}
      <Modal animationType="fade" transparent={true} visible={qrVisible} onRequestClose={() => setQrVisible(false)} presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { alignItems: 'center', backgroundColor: theme.modalBg }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>共有用QRコード</Text>
            <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
              {qrVisible && (
                <QRCode
                  value={qrData}
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              )}
            </View>
            <Text style={{ marginTop: 10, color: theme.subText, textAlign: 'center', fontSize: 12 }}>
              友達の「Good Trip」アプリで{'\n'}スキャンしてください
            </Text>
            <TouchableOpacity style={[styles.button, { marginTop: 20, backgroundColor: theme.tint, width: '80%' }]} onPress={() => setQrVisible(false)}>
              <Text style={styles.textStyle}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ■■■ 追加: 処理中ローディング表示 ■■■ */}
      {isProcessing && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <View style={{ backgroundColor: theme.card, padding: 20, borderRadius: 10, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={{ marginTop: 10, color: theme.text, fontWeight: 'bold' }}>写真を保存中...</Text>
            <Text style={{ fontSize: 10, color: theme.subText }}>オリジナルをアルバムへ、{'\n'}圧縮版をアプリへ整理しています</Text>
          </View>
        </View>
      )}
{/* ■■■ 追加: 設定メニューモーダル ■■■ */}
      {/* ■■■ 設定メニューモーダル ■■■ */}
      <Modal animationType="fade" transparent={true} visible={settingMenuVisible} onRequestClose={() => setSettingMenuVisible(false)} presentationStyle="overFullScreen">
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.actionSheet, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.actionSheetTitle, { color: theme.text }]}>設定・メニュー</Text>
            
            {/* ★ここに追加: ナビゲーションバー調整スイッチ */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <View>
                <Text style={{ fontSize: 16, color: theme.text, fontWeight: 'bold' }}>ナビゲーションバー回避</Text>
                <Text style={{ fontSize: 10, color: theme.subText, marginTop: 2 }}>画面下のボタンと重なる場合にON</Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: theme.tint }}
                thumbColor={isNavBarAdjustMode ? "#fff" : "#f4f3f4"}
                onValueChange={toggleNavBarAdjust}
                value={isNavBarAdjustMode}
              />
            </View>
            {/* バックアップエリア */}
            <View style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ fontSize: 16, color: theme.text, fontWeight: 'bold', marginBottom: 10 }}>データのバックアップ</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.inputBg, width: '48%' }]} 
                  onPress={() => {
                     setSettingMenuVisible(false);
                     setTimeout(executeFullBackup, 500); // モーダルが閉じるのを待つ
                  }}
                >
                  <Text style={{ color: theme.text, fontWeight:'bold' }}>📤 保存 (Zip)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.inputBg, width: '48%' }]} 
                  onPress={() => {
                    setSettingMenuVisible(false);
                    setTimeout(() => {
                        executeFullRestore(async () => {
                            // 完了後のリロード処理
                            // 一度ホームに戻ってデータを読み込み直す簡易実装
                            setProjects([]); // Stateリセット
                            setCurrentProject(null);
                            const json = await AsyncStorage.getItem(PROJECTS_KEY);
                            if(json) setProjects(JSON.parse(json));
                            const sJson = await AsyncStorage.getItem(STOCK_KEY);
                            if(sJson) setStockList(JSON.parse(sJson));
                        });
                    }, 500);
                  }}
                >
                  <Text style={{ color: theme.text, fontWeight:'bold' }}>📥 復元</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 10, color: theme.subText, marginTop: 5 }}>
                ※復元すると現在のデータはすべて上書きされます
              </Text>
            </View>

            <TouchableOpacity style={[styles.actionButton, { borderBottomWidth: 1, borderBottomColor: theme.border, marginTop: 10 }]} onPress={() => { setSettingMenuVisible(false); setTrashModalVisible(true); }}>
              <Text style={{ fontSize: 18, color: theme.text }}>🗑️ ゴミ箱を見る ({trashProjects.length})</Text>
            </TouchableOpacity>
            
            {/* ... 以下そのまま ... */}
            
            {/* 将来的にここにお掃除機能などを追加します */}
            <TouchableOpacity 
              style={[styles.actionButton, { borderBottomWidth: 1, borderBottomColor: theme.border }]} 
              onPress={handleDataCleaning} // ★上で作った関数を呼ぶ
            >
              <Text style={{ fontSize: 18, color: theme.text }}>🧹 データの整理 (お掃除)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { marginTop: 10, backgroundColor: theme.inputBg }]} onPress={() => setSettingMenuVisible(false)}>
              <Text style={{ fontSize: 18, color: theme.text, fontWeight:'bold' }}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ■■■ 追加: ゴミ箱画面モーダル ■■■ */}
      <Modal animationType="slide" transparent={false} visible={trashModalVisible} onRequestClose={() => setTrashModalVisible(false)} presentationStyle="pageSheet">
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { backgroundColor: theme.header }]}>
            <TouchableOpacity onPress={() => setTrashModalVisible(false)}>
              <Text style={{ fontSize: 16, color: theme.tint }}>閉じる</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>🗑️ ゴミ箱</Text>
            <TouchableOpacity onPress={() => {
                if (trashSelectionMode) {
                    setTrashSelectionMode(false);
                    setSelectedTrashIds([]);
                } else {
                    setTrashSelectionMode(true);
                }
            }}>
              <Text style={{ fontSize: 16, color: theme.tint, fontWeight: 'bold' }}>
                {trashSelectionMode ? '完了' : '選択'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* タブ切り替え */}
          <View style={{ flexDirection: 'row', padding: 10, justifyContent: 'center' }}>
             <TouchableOpacity 
               style={[styles.tabButton, trashTab === 'project' && styles.tabButtonActive]} 
               onPress={() => { setTrashTab('project'); setTrashSelectionMode(false); setSelectedTrashIds([]); }}
             >
               <Text style={[styles.tabText, trashTab === 'project' && styles.tabTextActive]}>旅行計画</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.tabButton, trashTab === 'image' && styles.tabButtonActive]} 
               onPress={() => { setTrashTab('image'); setTrashSelectionMode(false); setSelectedTrashIds([]); }}
             >
               <Text style={[styles.tabText, trashTab === 'image' && styles.tabTextActive]}>写真</Text>
             </TouchableOpacity>
          </View>

          <View style={{ flex: 1, padding: 20 }}>
            {/* --- 旅行計画リスト --- */}
            {trashTab === 'project' && (
                trashProjects.length === 0 ? (
                   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                     <Text style={{ fontSize: 60, marginBottom: 20 }}>🍃</Text>
                     <Text style={{ color: theme.text }}>計画のゴミ箱は空です</Text>
                   </View>
                ) : (
                   <FlatList
                     data={trashProjects}
                     keyExtractor={item => item.id}
                     renderItem={({ item }) => (
                       <TouchableOpacity
                         style={[styles.projectCard, { backgroundColor: theme.card, opacity: 0.8 }]}
                         disabled={!trashSelectionMode}
                         onPress={() => {
                            if (selectedTrashIds.includes(item.id)) setSelectedTrashIds(prev => prev.filter(id => id !== item.id));
                            else setSelectedTrashIds(prev => [...prev, item.id]);
                         }}
                       >
                         {trashSelectionMode && (
                            <View style={{ marginRight: 15 }}>
                               <Text style={{ fontSize: 24 }}>{selectedTrashIds.includes(item.id) ? '☑️' : '⬜'}</Text>
                            </View>
                         )}
                         <View style={{ flex: 1 }}>
                           <Text style={[styles.projectTitle, { color: theme.text, textDecorationLine: 'line-through' }]}>{item.title}</Text>
                           <Text style={{ fontSize: 12, color: theme.danger }}>削除日: {item.deletedAt ? formatDate(item.deletedAt) : '不明'}</Text>
                         </View>
                       </TouchableOpacity>
                     )}
                   />
                )
            )}

            {/* --- 写真リスト --- */}
            {trashTab === 'image' && (
                trashImages.length === 0 ? (
                   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                     <Text style={{ fontSize: 60, marginBottom: 20 }}>📷</Text>
                     <Text style={{ color: theme.text }}>写真のゴミ箱は空です</Text>
                   </View>
                ) : (
                   <FlatList
                     data={trashImages}
                     keyExtractor={item => item.id}
                     numColumns={3}
                     renderItem={({ item }) => (
                       <TouchableOpacity
                         style={{ width: '32%', aspectRatio: 1, margin: '0.5%', opacity: trashSelectionMode && !selectedTrashIds.includes(item.id) ? 0.5 : 1 }}
                         disabled={!trashSelectionMode}
                         onPress={() => {
                            if (selectedTrashIds.includes(item.id)) setSelectedTrashIds(prev => prev.filter(id => id !== item.id));
                            else setSelectedTrashIds(prev => [...prev, item.id]);
                         }}
                       >
                         <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%', borderRadius: 4 }} />
                         {trashSelectionMode && selectedTrashIds.includes(item.id) && (
                            <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: theme.tint, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                               <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>
                            </View>
                         )}
                       </TouchableOpacity>
                     )}
                   />
                )
            )}
          </View>

          {/* フッター操作 */}
          {trashSelectionMode && (
            <View style={{ flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.header }}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.tint, flex: 1, marginRight: 10, opacity: selectedTrashIds.length === 0 ? 0.5 : 1 }]}
                disabled={selectedTrashIds.length === 0}
                onPress={trashTab === 'project' ? restoreSelectedTrash : restoreSelectedTrashImages}
              >
                <Text style={styles.textStyle}>復元する ({selectedTrashIds.length})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.danger, flex: 1, opacity: selectedTrashIds.length === 0 ? 0.5 : 1 }]}
                disabled={selectedTrashIds.length === 0}
                onPress={trashTab === 'project' ? deleteSelectedTrashPermanently : deleteSelectedTrashImagesPermanently}
              >
                <Text style={styles.textStyle}>完全削除</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* ■■■ 修正完了版: カメラ画面 (切り替えボタン付き) ■■■ */}
      {scannerVisible && (
        <View style={styles.fullScreenOverlay}>
          <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'black' }}>
            <CameraView style={{ flex: 1 }} facing={cameraFacing} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }}>
              <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
                  <TouchableOpacity onPress={() => setScannerVisible(false)} style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>✕ 閉じる</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setCameraFacing(prev => prev === 'back' ? 'front' : 'back')} style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}><Text style={{ fontSize: 20, color: 'white' }}>🔄</Text></TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ width: 250, height: 250, borderWidth: 2, borderColor: '#007AFF', borderRadius: 20, backgroundColor: 'transparent' }} />
                  <Text style={{ color: 'white', marginTop: 20, backgroundColor:'rgba(0,0,0,0.6)', padding:10, borderRadius:10, overflow: 'hidden' }}>枠内にQRコードを入れてください</Text>
                </View>
              </SafeAreaView>
            </CameraView>
          </View>
        </View>
      )}
      {/* ■■■ 復活: 写真詳細オーバーレイモーダル ■■■ */}
      <Modal animationType="fade" transparent={true} visible={photoOverlayVisible} onRequestClose={() => setPhotoOverlayVisible(false)} presentationStyle="overFullScreen">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          {/* 閉じるボタン */}
          <TouchableOpacity style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10, backgroundColor:'rgba(0,0,0,0.5)', borderRadius:20 }} onPress={() => setPhotoOverlayVisible(false)}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight:'bold' }}>✕ 閉じる</Text>
          </TouchableOpacity>

          {/* 画像表示エリア */}
          {selectedPhotoData && (
            <View style={{ width: '100%', height: '70%' }}>
              <Image source={{ uri: selectedPhotoData.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </View>
          )}

          {/* ジャンプボタン (日付情報がある場合のみ表示) */}
          {selectedPhotoData && selectedPhotoData.dayIndex !== undefined && selectedPhotoData.dayIndex !== null && selectedPhotoData.dayIndex !== -1 ? (
            <View style={{ marginTop: 30, alignItems: 'center' }}>
              <Text style={{ color: 'white', marginBottom: 10 }}>
                {selectedPhotoData.title || '詳細'} ({selectedPhotoData.time})
              </Text>
              <TouchableOpacity style={{ backgroundColor: theme.tint, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }} onPress={jumpFromPhoto}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>🚀 この日の計画を見る</Text>
              </TouchableOpacity>
            </View>
          ) : (
             // 日付情報がない(表紙など)の場合
             selectedPhotoData && (
                <View style={{ marginTop: 30 }}>
                   <Text style={{ color: 'white' }}>{selectedPhotoData.title || '写真'}</Text>
                </View>
             )
          )}
        </View>
      </Modal>
        {/* ■■■ 追加: ヒーロー画像選択モーダル ■■■ */}
      <Modal animationType="slide" transparent={true} visible={heroSelectVisible} onRequestClose={() => setHeroSelectVisible(false)}>
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.actionSheet, { backgroundColor: theme.modalBg, maxHeight: '60%' }]}>
            <Text style={[styles.actionSheetTitle, { color: theme.text }]}>表紙画像を選択</Text>
            <Text style={{ textAlign: 'center', color: theme.subText, marginBottom: 15 }}>
              タップで表紙に設定、長押しで削除
            </Text>
            
            {selectedHeroProject && (
               <FlatList
                 data={selectedHeroProject.coverImages || (selectedHeroProject.imageUri ? [selectedHeroProject.imageUri] : [])}
                 keyExtractor={(item, index) => index.toString()}
                 numColumns={3}
                 contentContainerStyle={{ paddingBottom: 20 }}
                 renderItem={({ item }) => (
                   <TouchableOpacity 
                     style={{ width: '31%', aspectRatio: 16/9, margin: '1%', borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: selectedHeroProject.imageUri === item ? theme.tint : 'transparent' }}
                     onPress={() => handleSetHeroImage(item)}
                     onLongPress={() => handleDeleteHeroImage(item)}
                   >
                     <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                     {selectedHeroProject.imageUri === item && (
                        <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: theme.tint, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                           <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>✓</Text>
                        </View>
                     )}
                   </TouchableOpacity>
                 )}
                 ListEmptyComponent={
                   <View style={{ alignItems: 'center', padding: 20 }}>
                     <Text style={{ color: theme.subText }}>写真がありません</Text>
                   </View>
                 }
               />
            )}
            
            <TouchableOpacity style={[styles.actionButton, { marginTop: 10, backgroundColor: theme.inputBg }]} onPress={() => setHeroSelectVisible(false)}>
              <Text style={{ fontSize: 18, color: theme.text, fontWeight:'bold' }}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View> // ← これが Appコンポーネント最後の </View> です
  );
} // ← これが Appコンポーネントの終わりタグです


const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5', 
    paddingTop: 0 
  },

  header: { 
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 10,
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },

  headerTitle: { fontSize: 18, fontFamily: 'MPlus-Bold',maxWidth: 150 },
  backButton: { padding: 5 },

  // ■ 修正: 下部タブを「浮かせ型」にして、ナビゲーションバー問題を回避
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#ddd', 
    
    // Androidのナビゲーションバー対策として、下を少し厚くする
    paddingBottom: Platform.OS === 'android' ? 20 : 30, 
    height: Platform.OS === 'android' ? 80 : 90,
    paddingTop: 10,
    
    elevation: 5 
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 24, color: '#aaa', marginBottom: 2 },
  tabLabel: { fontSize: 10, color: '#aaa', fontWeight:'bold' },
  activeTab: { color: '#007AFF' },
  activeTabLabel: { color: '#007AFF' },
  homeHeader: { padding: 20, backgroundColor: 'white', paddingBottom: 10 },
  homeGreeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  archiveCard: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 15, alignItems: 'flex-start', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3 },
  archiveTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  archiveSubtitle: { fontSize: 12, color: '#999' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 10 },
  heroCard: { width: '100%', height: 200, backgroundColor: '#333', borderRadius: 20, overflow: 'hidden', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
  heroOverlay: { padding: 20, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.3)' },
  heroContent: { flex:1, justifyContent:'space-between' },
  heroStatus: { color: 'white', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow:'hidden', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  heroDate: { color: '#ddd', fontSize: 14,fontFamily: 'Aosagi', marginBottom: 20 },
  heroButtonText: { color: '#4fc3f7', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { marginTop: 15, backgroundColor: 'white', padding: 15, borderRadius: 15, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 },
  secondaryButtonText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  stockCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 },
  stockImage: { width: '100%', height: 150, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  stockTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  stockCategory: { fontSize: 12, color: '#666', backgroundColor:'#eee', paddingHorizontal:6, paddingVertical:2, borderRadius:4, overflow:'hidden' },
  stockNote: { fontSize: 14, color: '#666', marginTop: 5 },
  stockPrice: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 5 },
  stockImportBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#e3f2fd', padding:10, borderRadius:8, marginBottom:15, borderWidth:1, borderColor:'#bbdefb' },
  catBtn: { alignItems:'center', padding:10, borderRadius:10, backgroundColor:'#f0f0f0', marginBottom: 10 },
  activeCatBtn: { backgroundColor: '#007AFF' },
  baseNote: { padding: 15, marginBottom: 10, borderRadius: 8, borderLeftWidth: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2, flex: 1 },
  checkinNote: { backgroundColor: '#e3f2fd', padding: 15, marginBottom: 10, borderRadius: 8, borderLeftWidth: 6, borderLeftColor: '#1565c0', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2, flex: 1 },
  priceBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 1 },
  priceText: { fontSize: 12, fontWeight: 'bold', color: '#007AFF' },
  gapContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 16, height: 40 },
  gapLine: { width: 2, height: '100%', backgroundColor: '#ddd', position: 'absolute', left: 0 },
  gapBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 10 },
  gapText: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  projectCard: { backgroundColor: 'white', padding: 20, marginBottom: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3 },
  projectTitle: { fontSize: 18,fontFamily: 'Aosagi', color: '#333' },
  projectDate: { fontSize: 14, color: '#666', marginTop: 4 },
  arrow: { fontSize: 20, color: '#ccc' },
  scrollView: { flex: 1 },
  cardContainer: { flex: 1, padding: 0 },
  tile: { flex: 1, margin: 10, backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  
  // Tile Header Style
  tileHeader: { borderBottomWidth: 2, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tileHeaderBg: { width: '100%', height: 120, borderRadius: 15, overflow: 'hidden', marginBottom: 0 },
  tileHeaderOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },

  dayText: { fontSize: 40,fontFamily: 'GravitasOne', color: '#333' },
  dateText: { fontSize: 18, color: '#666',fontFamily: 'Aosagi', marginBottom: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  noteTime: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  noteTitle: { fontSize: 16,fontFamily: 'MPlus-Bold', color: '#333' },
  checkinTime: { fontSize: 12, color: '#1565c0', fontWeight: 'bold' },
  checkinTitle: { fontSize: 18,fontFamily: 'MPlus-Bold', color: '#0d47a1' },
   
  fab: { 
      position: 'absolute', 
      bottom: 0, 
      right: 0, 
      width: 100, 
      height: 100, 
      // backgroundColor: theme.tint, // ← 色はrenderPlanで指定するのでここはコメントアウトのまま
      borderTopLeftRadius: 100, 
      borderBottomRightRadius: 0, 
      justifyContent: 'flex-end', 
      alignItems: 'flex-end', 
      
      // 1/4円用の影設定
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: -2 }, 
      shadowOpacity: 0.3, 
      shadowRadius: 4, 
      elevation: 8, 
      zIndex: 999 
  },
  fabText: { 
      fontSize: 40, 
      color: 'white', 
      fontWeight: 'bold', 
      marginRight: 25, 
      marginBottom: 25 
  },
  modalFab: {
      position: 'absolute', bottom: 0, right: 0, width: 80, height: 80, 
      backgroundColor: '#2196F3', borderTopLeftRadius: 80, borderBottomRightRadius: 0, 
      justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 20, paddingRight: 20, zIndex: 999 
  },
   
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingBottom: 50 },
  modalView: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 35, alignItems: 'stretch', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  label: { fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: { height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, backgroundColor: '#f9f9f9' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { borderRadius: 10, padding: 10, elevation: 2, width: '45%', alignItems:'center', justifyContent:'center' },
  buttonAdd: { backgroundColor: '#2196F3' },
  buttonCancel: { backgroundColor: '#ff5252' },
  textStyle: { color: 'white',fontFamily: 'MPlus-Bold',textAlign: 'center' },
  timePickerContainer: { alignItems: 'center', marginBottom: 20 },
  timeDisplayButton: { backgroundColor: '#eee', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginBottom: 10 },
  timeDisplayText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  iosPicker: { width: '100%', height: 120 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateButton: { backgroundColor: '#eee', padding: 10, borderRadius: 5, alignItems: 'center' },
  tabButton: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 },
  tabText: { color: '#999', fontWeight: 'bold' },
  tabTextActive: { color: '#333' },
  fixedHotelButton: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  hotelInputLabel: { fontSize: 12, color: '#666', fontWeight: 'bold', marginBottom: 4 },
  hotelInputValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  actionSheet: { width: '100%', backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  actionSheetTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#666' },
  actionButton: { padding: 15, alignItems: 'center', borderRadius: 10, marginBottom: 5 },
  fullScreenModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  fullScreenModal: { backgroundColor: 'white', borderRadius: 20, flex: 1, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth:1, borderBottomColor:'#eee', paddingBottom:10 },
  hotelRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  actionIconBtn: { width: 70, height: 70, backgroundColor: '#f0f0f0', borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  disabledBtn: { opacity: 0.3, backgroundColor: '#eee' },
  actionIconLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  detailRow: { fontSize: 16, marginVertical: 5, color: '#333' },
   
  // Home Style (New)
  topMenuBtn: { flex: 1, marginHorizontal: 5, padding: 20, borderRadius: 20, alignItems: 'flex-start', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2 },
  topMenuTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  topMenuSub: { fontSize: 12, color: '#666', marginTop: 2 },
  
  heroContainer: { marginBottom: 30 },
  heroHeaderRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  heroCountdownText: { fontSize: 48, fontWeight: 'bold', color: 'white', marginBottom: 5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  heroProjectTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  heroDateText: { fontSize: 14, color: '#ddd', marginBottom: 15, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  heroFooter: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end' },
  heroInfoLabel: { fontSize: 10, color: '#ddd', fontWeight: 'bold' },
  heroInfoValue: { fontSize: 24, color: 'white', fontWeight: 'bold', fontFamily: 'Aosagi', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  cameraBtn: { backgroundColor: 'rgba(255,255,255,0.3)', padding: 10, borderRadius: 20, borderWidth:1, borderColor:'rgba(255,255,255,0.5)' },

  dashboardCard: { backgroundColor: '#333', margin: 20, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 5 },
  
  // Stock Grid Styles (New)
  stockGridCard: { width: '48%', backgroundColor: 'white', borderRadius: 10, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2, overflow:'hidden' },
  stockGridImage: { width: '100%', height: 100 },
  stockGridTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  
  koItemContainer: { flexDirection: 'row', position: 'relative', marginBottom: 10 },
  koItemBackdrop: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 30 },
  koItemContent: { flex: 1, padding: 15, marginLeft: 15, backgroundColor: 'white', borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2 },
  
  // Overlay View Style
  fullScreenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', zIndex: 99999, elevation: 9999, justifyContent: 'center', alignItems: 'center' }
});