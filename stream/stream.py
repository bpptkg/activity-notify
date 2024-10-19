from obspy.clients.seedlink.easyseedlink import EasySeedLinkClient
from obspy.core.stream import read
from obspy.core.stream import Stream
from obspy.core import UTCDateTime

client_addr = '192.168.0.25:18000'
net = 'VG'
cha = 'HHZ'

# Subclass the client class
class MyClient(EasySeedLinkClient):
    def on_data(self, trace):
        current_date = UTCDateTime.now().strftime('%Y-%m-%d')
        fn = f'/app/data/{current_date}.mseed'

        try:
            traces = read(fn)
            print(f'Appending to {fn}... \nstation: {trace.stats.station}  start: {trace.stats.starttime} end: {trace.stats.endtime}')
            traces.append(trace)
            traces.merge(fill_value="latest")
            traces.write(fn, format='MSEED')

        except FileNotFoundError:
            print(f'File {fn} does not exist. Creating a new file...')
            traces = Stream(traces=trace)
            traces.write(fn, format='MSEED')

        except Exception as e:
            print(f'Error appending to {fn}: {e}')

# Connect to a SeedLink server
client = MyClient(client_addr)

# Retrieve INFO:STREAMS
streams_xml = client.get_info('STREAMS')
print(streams_xml)

# Select a stream and start receiving data
client.select_stream(net, "MEPAS", cha)
client.select_stream(net, "MELAB", cha)
client.select_stream(net, "MEDEL", cha)
client.select_stream(net, "MEIMO", cha)
client.run()
