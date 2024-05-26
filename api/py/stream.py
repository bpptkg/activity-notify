from obspy.clients.seedlink.easyseedlink import EasySeedLinkClient
from obspy.core.trace import Trace
from obspy.core.stream import read
from obspy.core.stream import Stream
from obspy.core import UTCDateTime
import os

# client_addr is in address:port format
client_addr = '192.168.0.25:18000'
net = 'VG' # network code
sta = 'MEPAS' # station name
cha = 'HHZ' # channel

loc = '00' # Since obspy doesn't take location codes, this only affects the filename

day = UTCDateTime.now().strftime('%d')
i = 1
# fn = 'data/%s.D.%s' % (sta,day)
fn = 'data/D.%s' % (day)
# fn = 'data/%s.%s.%s.%s.D.%s' % (net, sta, loc, cha, day)
# fn = 'data/out'

if (os.path.isfile(fn)):
	read(fn)


# Subclass the client class
class MyClient(EasySeedLinkClient):
	# Implement the on_data callback
	def on_data(self, trace):
		global i
		global traces
		global fn
		global day
		if i == 1:
			print('Received traces. Checking for existing data...')
			if (os.path.isfile(fn)):
				print('Found %s, reading...' % fn)
				traces = read(fn)
				print('Done.')
			else:
				print('No data found. Creating new blank trace to write to...')
				traces = Stream()
			traces = Stream(traces=trace)
			print('Trace %s: %s' %(i, trace))
		else:
			print('Trace %s: %s' %(i, trace))
			traces.append(trace)
			traces.merge(fill_value="latest")
			# traces.__add__(trace,fill_value='interpolate')
			# try:
				# if (float(i)/10. == int(float(i)/10.)):
			print('Saving %s traces to %s...' % (i, fn))
			traces.write(fn, format='MSEED')
			print('Done.')
			# except Exception:
			# 	pass
		

		i += 1
		if (day != UTCDateTime.now().strftime('%d')):
			day = UTCDateTime.now().strftime('%d')
			fn = 'D.%s' % (day)
			# fn = "out"
			i = 1
		# if (traces.Stats.npts>3600):
		# 	# day = UTCDateTime.now().strftime('%Y.%j')
		# 	# fn = fn = '%s.%s.%s.%s.D.%s' % (net, sta, loc, cha, day)
		# 	# fn = "out"
		# 	i = 1


# Connect to a SeedLink server
client = MyClient(client_addr)

# Retrieve INFO:STREAMS
streams_xml = client.get_info('STREAMS')
print(streams_xml)

# Select a stream and start receiving data
client.select_stream(net,"MEPAS",cha)
client.select_stream(net,"MELAB",cha)
client.select_stream(net,"MEDEL",cha)
client.select_stream(net,"MEIMO",cha)
client.run()
