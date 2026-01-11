# SheetGenerator

PNG karelerinden sprite sheet atlas üreten, atlası oynatan ve her frame için nokta (marker) tanımlayan kompakt bir editör. Bu proje, hızlı üretim + temiz JSON/PNG export odaklıdır.

## Hedefler
- PNG frame setlerinden atlas oluşturma.
- Frame üzerinde noktalar ekleme, taşıma, yeniden adlandırma.
- Pivot uzayı seçimi (top-left, bottom-left, center).
- JSON + PNG export.
- Blender benzeri alt timeline ile oynatma, reverse ve hız kontrolü.
- Kompakt ama güçlü, tek ekranda tüm pipeline.

## UI Mimarisi (3 Panel)

### Sol Panel — **Point Studio**
Kullanıcının frame üzerindeki noktaları yönettiği alan.
- **Mode:** `Select` (taşıma/ seçme) ve `Add Point` (canvas tıklayınca ekler).
- **Center Point:** seçili frame’in tam ortasına nokta koyar.
- **Pivot Space:** koordinat gösterimi ve export dönüşümü.
- **Points List:** tüm noktaların isimleri ve koordinatları listelenir.
- **Selected Point:** seçili noktanın adı ve X/Y değeri düzenlenir.

### Orta Panel — **Scene**
Frame/Atlas görüntüsü ve oynatma kontrolleri.
- **Tabs:** `Frame` (nokta edit) ve `Atlas` (tam atlas önizleme).
- **Grid / Points Toggle:** görünürlük yönetimi.
- **Stage Canvas:** frame üzerinde noktalar, pivot marker ve grid.
- **Alt Timeline:** play/pause, ileri/geri, reverse, loop, FPS ve hız seçimi.

### Sağ Panel — **Atlas Pipeline**
İçe aktarma, atlas ayarları ve export.
- **PNG Import:** çoklu frame yükleme.
- **JSON Import:** aynı isimli frame’lerde noktaları günceller.
- **Atlas Settings:** `Rows` ve `Padding`.
- **Export:** atlas PNG + JSON.
- **Status:** hücre boyutu, atlas boyutu, size mismatch uyarısı.

## Kullanım Akışı
1. **PNG import** (sağ panel).
2. **Frame üzerinde nokta ekle** (sol panel `Add Point` + canvas tıkla).
3. **Rename ve konum düzenle** (sol panel `Selected Point`).
4. **Timeline ile test et** (alt panel).
5. **Rows / Padding ayarla** (sağ panel).
6. **PNG + JSON export al**.

## Veri Modeli

### Frame
Her PNG bir frame olarak saklanır.
- `name`: dosya adı.
- `width / height`: orijinal boyut.
- `points`: frame’e ait marker listesi.

### Point
Her nokta frame’e aittir.
- `id`: benzersiz id.
- `name`: kullanıcı adı.
- `x / y`: frame koordinatı (top-left referanslı tutulur).

## Pivot Dönüşümleri
Koordinatlar **storage** tarafında her zaman `top-left` tutulur. Export sırasında seçili pivot moduna göre dönüşüm yapılır.

- **Top-left**:  
  `exportX = x`  
  `exportY = y`
- **Bottom-left**:  
  `exportX = x`  
  `exportY = frameHeight - y`
- **Center**:  
  `exportX = x - frameWidth / 2`  
  `exportY = y - frameHeight / 2`

Import sırasında JSON’daki pivot bilgisi varsa, ters dönüşüm uygulanır.

## Atlas Üretimi
Atlas, `Rows` ve `Padding` değerlerine göre hesaplanır.
- **Cell Size:** `max(frameWidth)` ve `max(frameHeight)` kullanılır.
- **Columns:** `ceil(frameCount / rows)`.
- **Padding:** hücreler ve dış kenar arasına uygulanır.

**Farklı frame boyutları varsa:**  
Hücre boyutu max frame’e göre hesaplanır, küçük frame’ler hücre içinde merkeze oturtulur.

## Export Formatları

### PNG
Atlas çıktı görüntüsü:
- Tüm frame’ler atlas konumlarına çizilir.
- `rows`, `padding` ve max cell boyutu dikkate alınır.

### JSON
Önerilen yapı (otomatik üretilir):
```json
{
  "meta": {
    "app": "SheetGenerator",
    "version": 1,
    "image": "sprite-atlas.png",
    "size": { "w": 1024, "h": 512 },
    "rows": 4,
    "columns": 6,
    "padding": 6,
    "frameCount": 24,
    "cell": { "w": 128, "h": 128 },
    "pivotMode": "top-left"
  },
  "frames": [
    {
      "id": "frame-id",
      "name": "run_01.png",
      "index": 0,
      "frame": { "x": 6, "y": 6, "w": 128, "h": 128 },
      "sourceSize": { "w": 128, "h": 128 },
      "spriteSourceSize": { "x": 0, "y": 0, "w": 128, "h": 128 },
      "points": [
        { "id": "pt-1", "name": "hand", "x": 12, "y": 88 }
      ]
    }
  ]
}
```

## Import JSON
- Frame `name` eşleşirse noktalar o frame’e yüklenir.
- JSON `meta.pivotMode` mevcutsa otomatik dönüşüm yapılır.
- Mevcut noktalar yeni import ile overwrite edilir.

## Tasarım İlkeleri
- **Kompakt bilgi yoğunluğu:** tek ekranda tüm pipeline.
- **Görsel hiyerarşi:** panel ayrımları, soft shadow, gradient taban.
- **Modern tipografi:** Space Grotesk + DM Mono.
- **Canvas odağı:** sahne net ve geniş, kontroller minimal.

## Geliştirme
```bash
npm install
npm run dev
```

## Notlar
- Frame’ler PNG olmalı.
- Büyük atlaslar için daha yüksek `rows` daha iyi görsel dağılım sağlar.
- JSON export pivot moduna göre dönüşüm içerir; oyun motorunda aynı pivot kullanılması önerilir.
