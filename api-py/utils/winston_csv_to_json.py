import numpy as np
import csv
from io import StringIO
from typing import List, Tuple
import csv

def winston_csv_to_json(csv_string: str) -> List[Tuple[str, float]]:
    reader = csv.reader(StringIO(csv_string))
    return np.array([
        (row[0], abs(float(row[1])))
        for row in reader
        if row 
    ])