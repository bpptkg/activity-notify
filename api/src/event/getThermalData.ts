import axios from "axios";
import { logger } from "../logger";
import dayjs from "dayjs";
import { thermalDb } from "../db";
import { notifyThermalData } from "./notifyThermalData";

let queryData = false
export const getThermalData = async () => {
  if (queryData) {
    return
  }

  queryData = true
  const locations = ['krasak', 'bebeng', 'boyong', 'kubah-bd']
  try {
    const [krasak, bebeng, boyong, kubahBd] = await Promise.all(locations.map(async (location) => {
      const { data } = await axios.get(
        `http://192.168.0.43:8333/api/v1/thermal-axis-kal/?area=${location}&sampling=minute&start=${dayjs().subtract(3, 'minutes').format('YYYY-MM-DD HH:mm:ss')}&end=${dayjs().add(3, 'minutes').format('YYYY-MM-DD HH:mm:ss')}&field_type=max_temp&use_sky_filter=true`
        , { headers: { Authorization: 'Api-Key 1JPZxKW5.RCpwvwK5O4T5hYFTzfPpSp9o2PdTtRwa' } });

      return data.pop()
    }))

    const [krasakAvg, bebengAvg, boyongAvg, kubahBdAvg] = await Promise.all(locations.map(async (location) => {
      const { data } = await axios.get(
        `http://192.168.0.43:8333/api/v1/thermal-axis-kal/?area=${location}&sampling=minute&start=${dayjs().subtract(3, 'minutes').format('YYYY-MM-DD HH:mm:ss')}&end=${dayjs().add(3, 'minutes').format('YYYY-MM-DD HH:mm:ss')}&field_type=avg_temp&use_sky_filter=true`
        , { headers: { Authorization: 'Api-Key 1JPZxKW5.RCpwvwK5O4T5hYFTzfPpSp9o2PdTtRwa' } });

      return data.pop()
    }))


    thermalDb.update(async (data) => {
      data.krasak = krasak ? [dayjs(krasak.timestamp).format('YYYY-MM-DD HH:mm:ss'), krasak.temp] : ['', 0]
      data.bebeng = bebeng ? [dayjs(bebeng.timestamp).format('YYYY-MM-DD HH:mm:ss'), bebeng.temp] : ['', 0]
      data.boyong = boyong ? [dayjs(boyong.timestamp).format('YYYY-MM-DD HH:mm:ss'), boyong.temp] : ['', 0]
      data.kubahBd = kubahBd ? [dayjs(kubahBd.timestamp).format('YYYY-MM-DD HH:mm:ss'), kubahBd.temp] : ['', 0]
      data.krasakAvg = krasakAvg ? [dayjs(krasakAvg.timestamp).format('YYYY-MM-DD HH:mm:ss'), krasakAvg.temp] : ['', 0]
      data.bebengAvg = bebengAvg ? [dayjs(bebengAvg.timestamp).format('YYYY-MM-DD HH:mm:ss'), bebengAvg.temp] : ['', 0]
      data.boyongAvg = boyongAvg ? [dayjs(boyongAvg.timestamp).format('YYYY-MM-DD HH:mm:ss'), boyongAvg.temp] : ['', 0]
      data.kubahBdAvg = kubahBdAvg ? [dayjs(kubahBdAvg.timestamp).format('YYYY-MM-DD HH:mm:ss'), kubahBdAvg.temp] : ['', 0]
    })

    notifyThermalData(thermalDb.data)
    
  } catch (error: any) {
    logger.error(error.toString())
  }
  queryData = false
}