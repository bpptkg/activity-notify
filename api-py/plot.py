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

def plot_waveforms(eventtime: str,namafile1: str):
    sta = ["MEPAS","MELAB","MEDEL","MEIMO"]
    eventtime = UTCDateTime(eventtime)
    namafile =  f"./data/{eventtime.strftime('%Y-%m-%d')}.mseed"
    st = read(namafile)
    tstart = eventtime - 10
    tend = tstart + 30
    st.trim(starttime=tstart,endtime=tend)

    st = st.detrend()
    st = st.taper(0.01)
    st = st.filter("bandpass", freqmin=0.5, freqmax =15)

    fig = plt.figure(figsize=(8, 10))
    plt.subplots_adjust(top=0.90)
    plt.subplots_adjust(wspace= 0.25, hspace= 0.25)
    

    for i in range(4):
        st0 = st.select(station=sta[i], channel='HHZ')
        ax1 = fig.add_subplot(8,1,i*2+1)
        ax2 = fig.add_subplot(8,1,i*2+2)

        if (len(st0))==1:
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
                ax2.set_xlabel("time(s)" )

        else:
            print("empty trace for %s" %(sta[i]))
            if sta[i]=="MEPAS":
                amp1 = np.nan
            elif sta[i]=="MELAB":
                amp2 = np.nan
            ax1.set_xticklabels([])
            if i==3:
                t= np.arange(3500)
                ax2.plot(t,np.zeros(len(t)),color="w")
                ax2.set_xlim(0,35)
                ax2.set_xlabel("time(s)" )
            else:
                ax2.set_xticklabels([])
    ramp = amp1/amp2
    fig.suptitle("SINOAS G. Merapi"+ "\n\n"+ "Event " + UTCDateTime.strftime(tstart+3,format="%Y-%m-%d %H:%M:%S") + " UTC"+ " // " 
                 + UTCDateTime.strftime(tstart+25200,format="%Y-%m-%d %H:%M:%S") + " WIB"+ "\n" 
                 + " Amax= " + '%.2f' % amp1 + " r_Amax= " + '%.2f' % ramp)
    plt.subplots_adjust(bottom=0.07)
    plt.savefig( namafile1 )

