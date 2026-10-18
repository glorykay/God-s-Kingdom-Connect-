import sys
from getpass import getpass
from netmiko import ConnectHandler

# ----------------------------------------------------
# 1. Empty device dictionary
# ----------------------------------------------------
device = {}

# ----------------------------------------------------
# 2. Supported Cisco device types (11 total)
# Pulled from CLASS_MAPPER_BASE in Netmiko
# ----------------------------------------------------
supported_devices = [
    "cisco_ios",
    "cisco_xe",
    "cisco_xr",
    "cisco_nxos",
    "cisco_asa",
    "cisco_ftd",
    "cisco_s300",
    "cisco_tp",
    "cisco_wlc",
    "cisco_viptela",
    "cisco_s200"
]

# ----------------------------------------------------
# 3. While loop to validate device type
# ----------------------------------------------------
while True:
    dev_type = input("Enter device type (or 'q' to quit): ").strip()

    if dev_type.lower() == "q":
        print("Exiting program.")
        sys.exit()

    if dev_type not in supported_devices:
        print("\nDevice type NOT supported.")
        print("Supported device types:")
        for d in supported_devices:
            print(" -", d)
        print()
        continue  # ask again

    # valid device type
    break

# ----------------------------------------------------
# 4. Add device_type to dictionary
# ----------------------------------------------------
device["device_type"] = dev_type

# ----------------------------------------------------
# 5. Prompt for username
# ----------------------------------------------------
username = input("Enter username: ").strip()
device["username"] = username

# ----------------------------------------------------
# 6. Prompt for password (getpass)
# ----------------------------------------------------
password = getpass("Enter password: ")
device["password"] = password

# ----------------------------------------------------
# 7. Ask about enable password
# ----------------------------------------------------
enable_choice = input("Do you want to enter an enable password? (yes/no): ").strip().lower()

if enable_choice == "yes":
    secret = getpass("Enter enable password: ")
    device["secret"] = secret

# ----------------------------------------------------
# 8. Prompt for host
# ----------------------------------------------------
host = input("Enter host IP or hostname: ").strip()
device["host"] = host

# ----------------------------------------------------
# 9. Create empty commands list
# ----------------------------------------------------
commands = []

# ----------------------------------------------------
# 10. While loop to gather commands
# ----------------------------------------------------
while True:
    if len(commands) == 0:
        cmd = input("Enter a command: ").strip()
        commands.append(cmd)
    else:
        more = input("Do you want to enter another command? (yes/no): ").strip().lower()
        if more == "yes":
            cmd = input("Enter a command: ").strip()
            commands.append(cmd)
        else:
            break

# ----------------------------------------------------
# 11. Connect to device
# ----------------------------------------------------
print("\nConnecting to device...")
net_connect = ConnectHandler(**device)

# ----------------------------------------------------
# 12. Enter enable mode if secret provided
# ----------------------------------------------------
if "secret" in device:
    net_connect.enable()

# ----------------------------------------------------
# 13. Run commands (config or show)
# send_config_set handles both safely
# ----------------------------------------------------
print("\nRunning commands...\n")
output = net_connect.send_config_set(commands)

# ----------------------------------------------------
# 14. Print results
# ----------------------------------------------------
print(output)

# ----------------------------------------------------
# 15. Disconnect
# ----------------------------------------------------
net_connect.disconnect()
print("\nDisconnected from device.")
