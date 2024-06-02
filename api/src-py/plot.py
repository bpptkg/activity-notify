""" Plot Waveform and Spectrogram
Created on Thu Aug  4 10:30:45 2022

@author: Merapi116_ABS
"""
import numpy as np
from obspy import UTCDateTime
# from obspy.clients.arclink import Client
from obspy import read
import matplotlib.pyplot as plt
import argparse
# import os
# import glob as glob

def plot_wf(st,ax):
    Fs = st[0].stats.sampling_rate
    sta = st[0].stats.station
    t= np.arange(st[0].stats.npts) / Fs
    ax.plot(t, st[0].data, color='k', label=sta, linewidth=1)
    ax.set_xticklabels([])
    ax.set_ylabel("Amp (Count)")
    ax.legend(bbox_to_anchor=(1, 0.1))
    ax.set_xlim(0,30)

def plot_spect(st,ax):
    st.spectrogram(axes=ax, cmap="seismic")
    # ax.set_xticklabels([])
    ax.minorticks_on()
    ax.set_ylabel("Freq (Hz)")
    ax.set_ylim(0,15)
    ax.set_xlim(0,30)
    plt.grid(visible=True,axis="y")

def plot_waveforms(eventtime,namafile1):
# def plot_wf_spect(namafile):
    parser = argparse.ArgumentParser(description='eventtime and output filename')
    parser.add_argument('eventtime', type=str,help='eventtime')
    parser.add_argument('namafile1', type=str,help='filename out')
    args = parser.parse_args()
    # print(args)
    eventtime = args.eventtime #"/content/msdoutput.msd.2024,05,03,08,53,41_auto"
    namafile1 = args.namafile1
    # def plotwf_file(namafile):
    # t0 = 0 # 5, 0 seconds to onset
    # t1 = 0 + t0 #seconds before onset for plot
    # t2 = 30 + t0 #seconds after onset for plot

    sta = ["MEPAS","MELAB","MEDEL","MEIMO"]
    eventtime = UTCDateTime(eventtime)
    namafile =  f"/app/data/{eventtime.strftime('%Y-%m-%d')}.mseed"
    # namafile = "./src-py/1.mseed"
    # print(eventtime)

    # print(daynow.day)
    st = read(namafile)
    # print(namafile,st[0])
    tstart = eventtime - 10
    tend = tstart + 30
    # print(tstart,tend)
    st.trim(starttime=tstart,endtime=tend)
    # print(namafile,st[0])

    st = st.detrend()
    st = st.taper(0.01)
    st = st.filter("bandpass", freqmin=0.5, freqmax =15)

    
    # st2 = st2.trim(starttime=tstart,endtime=tstart+t2)

    fig = plt.figure(figsize=(8, 10))
    plt.subplots_adjust(top=0.90)
    plt.subplots_adjust(wspace= 0.25, hspace= 0.25)
    

    for i in range(4):
        # print(sta[i])
        st0 = st.select(station=sta[i], channel='HHZ')
        ax1 = fig.add_subplot(8,1,i*2+1)
        ax2 = fig.add_subplot(8,1,i*2+2)

        if (len(st0))==1:
            # print(st0)
            Fs = st0[0].stats.sampling_rate
            t= np.arange(st0[0].stats.npts) / Fs
            if sta[i]=="MEPAS":
                amp1 = np.abs(st0[0].max())
            elif sta[i]=="MELAB":
                amp2 = np.abs(st0[0].max())
            plot_wf(st0,ax1)
            plot_spect(st0,ax2)
            if i != 3:
                ax1.set_xticklabels([])
                ax2.set_xticklabels([])
            else:
                # ax2.set_xlabel("time(s)")
                ax2.set_xlabel("time(s)" )

        else:
            print("empty trace for %s" %(sta[i]))
            if sta[i]=="MEPAS":
                amp1 = np.NaN
            elif sta[i]=="MELAB":
                amp2 = np.NaN
            ax1.set_xticklabels([])
            if i==3:
                t= np.arange(3500)
                ax2.plot(t,np.zeros(len(t)),color="w")
                ax2.set_xlim(0,35)
                ax2.set_xlabel("time(s)" )
            else:
                ax2.set_xticklabels([])
            # ax1.plot(t, None, color='k', label=sta, linewidth=1)
    # print(amp1,amp2)
    ramp = amp1/amp2
    # try:
    #     amp2 = np.NaN
    #     amp1=amp2
    #     ramp = amp1/amp2
    #     print("ramp",ramp)
    # except Exception:
    #     print("ramp",ramp)
    #     ramp = None
    #     pass
    # plt.text(25,-15,"SINOAS Merapi")
    # bbox=ax2.get_position()
    # ax2.text(bbox.x1,bbox.y0,"SINOAS Merapi")
    # print(bbox)
    fig.suptitle("SINOAS G. Merapi"+ "\n\n"+ "Event " + UTCDateTime.strftime(tstart+3,format="%Y-%m-%d %H:%M:%S") + " UTC"+ " // " 
                 + UTCDateTime.strftime(tstart+25203,format="%Y-%m-%d %H:%M:%S") + " WIB"+ "\n" 
                 + " Amax= " + '%.2f' % amp1 + " r_Amax= " + '%.2f' % ramp)
    # fig.tight_layout()
    plt.subplots_adjust(bottom=0.07)
    plt.savefig( namafile1 )
    # plt.savefig( UTCDateTime.strftime(tstart,format="%Y%m%d%H%M%S%f")[:-4]  +  ".jpg")


if __name__ == "__main__":
  plot_waveforms("msdoutput.msd.2024,05,03,08,53,41_auto","./out.png")  # Replace with your filename

