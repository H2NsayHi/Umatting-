from fastapi import FastAPI
from pydantic import BaseModel
import socket
from fastapi.middleware.cors import CORSMiddleware

# Define a Pydantic model to validate the incoming request
class PLCRequest(BaseModel):
    PLC_IP: str
    PLC_PORT: int
    REGISTER_CODE: int
    NUM_DATA_POINTS: int

# Initialize FastAPI app
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Full command according to MC Protocol
def format_command(REGISTER_CODE, NUM_DATA_POINTS):
    IO_NUMBER = "01" # Sub Header
    NETWORK_NUMBER = "FF" # PC No
    MONITORING_TIMER = 10 # Timer for waiting for the response (000A = 10s)
    DEVICE_CODE = "4420" # Device code is Data register
    
    start_register = format(REGISTER_CODE, '08X')
    num_data_points = format(NUM_DATA_POINTS, '02X')
    monitor_timer = format(MONITORING_TIMER, '04X')

    command = f"{IO_NUMBER}{NETWORK_NUMBER}{monitor_timer}{DEVICE_CODE}{start_register}{num_data_points}00"
    return command

# Function to read data from the PLC
def read_data(ip, port, REGISTER_CODE, NUM_DATA_POINTS):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        # Get full command
        command = format_command(REGISTER_CODE, NUM_DATA_POINTS)
        
        # Receive the response from the PLC
        sock.connect((ip, port))
        sock.sendall(command.encode("ascii"))
        response = sock.recv(1024)
        
        # Check data and Adjust if the value is negative
        data_section = response[4:]  # data starts from the 4th byte
        data_integers = []
        for i in range(0, len(data_section), 4):
            data_integer = int(data_section[i:i+4], 16)
            if data_integer >= 0x8000:  # 32768 in decimal
                data_integer -= 0x10000  # 65536 in decimal
            data_integers.append(data_integer)

        return data_integers

# POST endpoint for reading data
@app.post("/read_plc_data/")
async def read_plc_data(request: PLCRequest):
    datas = read_data(request.PLC_IP, request.PLC_PORT, request.REGISTER_CODE, request.NUM_DATA_POINTS)
    return {"datas": datas}

