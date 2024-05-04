import http from "node:http";
import url from "node:url";

const port = 18000;

const startSSE = (res) => {
  res.writeHead(200, {
    'Content-Type': "text/event-stream",
    'Cache-Control': "no-cache",
    'Connection': "keep-alive",
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
  });
  res.write('\n');
}

let mepas, melab = 0
let mepasRaw, melabRaw = ''
let alertMessage = ''
let date = ''
let loading = false
const getRsamData = async () => {
  loading = true
  try {
    const [mepasRawVal, melabRawVal] = await Promise.all(['MEPAS_HHZ_VG_00', 'MELAB_HHZ_VG_00'].map(async (code) => {
      const response = await fetch(`http://192.168.0.45:16030/rsam/?code=${code}&t1=-0.0005&rsamP=10&tz=Asia/Jakarta&csv=1`);
      const data = await response.text();
      return (data.split('\n').filter(Boolean).reverse()[0])
    }))

    mepasRaw = mepasRawVal
    melabRaw = melabRawVal
    mepas = Number(mepasRawVal.split(',')[1])
    melab = Number(melabRawVal.split(',')[1])
    date = mepasRawVal.split(',')[0]

    const apgAlert = mepas > 5000 && mepas / melab < 2
    const vtAlert = mepas > 50000 && mepas / melab > 2

    if (apgAlert) {
      alertMessage = `Nilai RSAM ${Math.round(mepas)} <br> Waspadai Kejadian APG > 1KM <br> <span style="font-size:12px;font-weight:normal">${date}</span>`
    } else if (vtAlert) {
      alertMessage = `Nilai RSAM ${Math.round(mepas)} <br>Terjadi Gempa VT Kuat <br> <span style="font-size:12px;font-weight:normal">${date}</span>`
    } else {
      alertMessage = ''
    }
  } catch (error) {
    console.error(error)
  }

  loading = false
}

setInterval(() => {
  if (!loading) {
    getRsamData()
  }
}, 1000);

http.createServer(async (req, res) => {
  const uri = url.parse(req.url).pathname;

  if (uri === '/notify') {
    startSSE(res)
    let localAlertMessage = '';
    res.write(`data: ${JSON.stringify({ message: alertMessage })}\n\n`);

    let i = 0
    let interval = setInterval(() => {
      i++
      if (localAlertMessage != alertMessage || i > 30) {
        i = 0
        localAlertMessage = alertMessage
        res.write(`data: ${JSON.stringify({ message: alertMessage })}\n\n`);
      }
    }, 1000)

    res.on('close', () => {
      clearInterval(interval)
      res.end()
    })
    return;
  }

  if (uri === '/rsam') {
    startSSE(res)
    res.write(`data: ${JSON.stringify({ mepasRaw: mepasRaw, mepas: mepas, melabRaw: melabRaw, melab: melab })}\n\n`);

    let interval = setInterval(() => {
      res.write(`data: ${JSON.stringify({ mepasRaw: mepasRaw, mepas: mepas, melabRaw: melabRaw, melab: melab })}\n\n`);
    }, 1000)

    res.on('close', () => {
      clearInterval(interval)
      res.end()
    })
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Endpoint not found.');
}).listen(port);

console.log(`server running: http://localhost:${port}\n\n`);