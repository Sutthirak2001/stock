#!/usr/bin/env python
import sys
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# รับพารามิเตอร์จาก Node.js
bank_code = sys.argv[1]
input_data_json = sys.argv[2]
input_data = json.loads(input_data_json)

# ฟังก์ชันพยากรณ์ราคาหุ้น
def predict_stock_price(bank_code, input_data):
    try:
        # โหลดโมเดลตามธนาคาร
        model_path = f"./models/{bank_code}_model.pkl"
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        # โหลด scaler
        scaler_path = f"./models/{bank_code}_scaler.pkl"
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        
        # จัดเตรียมข้อมูลสำหรับการพยากรณ์
        features = [
            input_data['open_price'], input_data['high'], input_data['low'],
            input_data['volume'], input_data['percentage_change'], input_data['gdp'],
            input_data['interest_rate'], input_data['total_assets'], 
            input_data['total_equity'], input_data['total_liabilities'],
            input_data['net_profit'], input_data['eps'], input_data['pe'],
            input_data['pbv'], input_data['market_cap'], 
            input_data['book_value_per_share'], input_data['roe'], input_data['roa']
        ]
        
        # แปลงเป็น numpy array และปรับขนาด
        features_array = np.array(features).reshape(1, -1)
        scaled_features = scaler.transform(features_array)
        
        # พยากรณ์ราคา
        predicted_price = model.predict(scaled_features)[0]
        
        return {
            "predicted_price": round(float(predicted_price), 2),
            "status": "success"
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

result = predict_stock_price(bank_code, input_data)
print(json.dumps(result))