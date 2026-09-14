import os
import json
import pandas as pd

def convert_mcu_data():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    excel_path = os.path.join(base_dir, 'Dummy_Dataset_MCU_BI.xlsx')
    output_dir = os.path.join(base_dir, 'src', 'data')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'mcuData.json')

    excel = pd.ExcelFile(excel_path)
    pegawai = excel.parse('Pegawai')
    params = excel.parse('Parameter_Referensi')
    mcu_rec = excel.parse('MCU_Record')
    mcu_dtl = excel.parse('MCU_Detail')

    # Standardize types and strings
    pegawai['NIP'] = pegawai['NIP'].astype(str)
    pegawai['Tanggal_Lahir'] = pegawai['Tanggal_Lahir'].astype(str)

    mcu_rec['NIP'] = mcu_rec['NIP'].astype(str)
    mcu_rec['Tanggal_MCU'] = mcu_rec['Tanggal_MCU'].astype(str)
    mcu_rec['Tahun'] = pd.to_datetime(mcu_rec['Tanggal_MCU']).dt.year

    params['ID_Param'] = params['ID_Param'].astype(str)
    params['Min_Normal'] = params['Min_Normal'].astype(float)
    params['Max_Normal'] = params['Max_Normal'].astype(float)

    mcu_dtl['ID_Param'] = mcu_dtl['ID_Param'].astype(str)
    mcu_dtl['Nilai_Hasil'] = mcu_dtl['Nilai_Hasil'].astype(float)
    mcu_dtl['Status'] = mcu_dtl['Status'].astype(str)

    data = {
        'pegawai': pegawai.to_dict(orient='records'),
        'parameters': params.to_dict(orient='records'),
        'mcu_records': mcu_rec.to_dict(orient='records'),
        'mcu_details': mcu_dtl.to_dict(orient='records')
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully converted dataset:")
    print(f"- Pegawai: {len(data['pegawai'])}")
    print(f"- Parameter: {len(data['parameters'])}")
    print(f"- MCU Records: {len(data['mcu_records'])}")
    print(f"- MCU Details: {len(data['mcu_details'])}")
    print(f"Saved to: {output_path}")

if __name__ == '__main__':
    convert_mcu_data()
