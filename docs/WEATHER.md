# Weather and outdoor clothing

Scene modes: sun, cloudy, overcast, fog, haze, rain, snow; night is an independent lighting condition. Manual selection supports every mode. WMO 2/3 map to cloudy/overcast, 45/48 to fog; precipitation keeps priority.

The optional Open-Meteo air-quality request uses the same approximate coordinates as weather, current pm2_5/pm10 and Unix time. No key is needed for the existing non-commercial use. Attribution: Open-Meteo / CAMS (CC BY 4.0). Documentation: https://open-meteo.com/en/docs/air-quality-api

A model estimate no more than three hours old with PM2.5 >= 75 or PM10 >= 150 enables a mask and, without rain/snow/fog, a muted haze appearance. These are game presentation thresholds, NOT a local official haze observation or Chinese AQI classification. UI says “霾感 · 颗粒物偏高”. Missing or expired data never implies clean air, but does not activate an unverified haze scene. Air quality failure does not discard a valid forecast. Both are cached for 15 minutes; failures back off using existing weather rules.

Rain uses a fitted poncho and hood, leaving hands free for reading and other activities. Masks and rainwear are outdoors only, for both seated characters. The bench has a deeper seat and rearward backrest; hips are forward of the rails, while the body bottom still meets seat top at y=.3175.
