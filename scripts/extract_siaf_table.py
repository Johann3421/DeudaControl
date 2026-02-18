#!/usr/bin/env python3
"""
Script para extraer datos de la tabla expedienteDetalles de SIAF
Requiere: requests, beautifulsoup4
"""

import sys
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime

def extract_siaf_results(url, captcha_code=None, cookies=None):
    """
    Extrae los datos de la tabla expedienteDetalles de SIAF
    
    Args:
        url: URL completa de SIAF con los parámetros
        captcha_code: Código CAPTCHA (opcional)
        cookies: Cookies de sesión (opcional)
    
    Returns:
        dict con estructura de resultados
    """
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        # Hacer request a SIAF
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        
        # Parsear HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Buscar tabla de resultados
        table = soup.find('table', {'id': 'expedienteDetalles'})
        
        if not table:
            return {
                'success': False,
                'error': 'No se encontró la tabla expedienteDetalles',
                'datos': [],
                'info_siaf': {}
            }
        
        # Extraer filas
        rows = []
        tbody = table.find('tbody')
        
        if tbody:
            for tr in tbody.find_all('tr'):
                tds = tr.find_all('td')
                if len(tds) >= 12:
                    row = {
                        'ciclo': tds[0].text.strip(),
                        'fase': tds[1].text.strip(),
                        'secuencia': tds[2].text.strip(),
                        'correlativo': tds[3].text.strip(),
                        'codDoc': tds[4].text.strip(),
                        'numDoc': tds[5].text.strip(),
                        'fecha': tds[6].text.strip(),
                        'ff': tds[7].text.strip(),
                        'moneda': tds[8].text.strip(),
                        'monto': tds[9].text.strip(),
                        'estado': tds[10].text.strip(),
                        'fechaHora': tds[11].text.strip(),
                    }
                    rows.append(row)
        
        # Extraer info general (primera fila como referencia)
        info_siaf = {}
        if rows:
            info_siaf = {
                'fase': rows[0].get('fase', ''),
                'estado': rows[0].get('estado', ''),
                'fechaProceso': rows[0].get('fechaHora', '').split()[0] if rows[0].get('fechaHora') else '',
            }
        
        return {
            'success': True,
            'error': None,
            'datos': rows,
            'info_siaf': info_siaf,
            'timestamp': datetime.now().isoformat(),
        }
    
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': f'Error en request a SIAF: {str(e)}',
            'datos': [],
            'info_siaf': {}
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Error extrayendo datos: {str(e)}',
            'datos': [],
            'info_siaf': {}
        }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Uso: python extract_siaf_table.py <url>'
        }))
        sys.exit(1)
    
    url = sys.argv[1]
    result = extract_siaf_results(url)
    print(json.dumps(result, ensure_ascii=False, indent=2))
