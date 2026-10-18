from netmiko import ConnectHandler
import getpass
import sys

hosts = ["10.10.10.1", "10.10.11.1", "10.10.12.1"]
user = 'admin'
dev_type = 'juniper_junos'
port = '22'
commands = ["show version", "show configuration", "set interfaces et-2/0/0 promiscuous-mode"]

try:
    passwd = getpass.getpass(prompt="User password")
except Exception as e:
    print(f'Error obtaining password: {e}')
    sys.exit()

for host in hosts:
    try:
        ssh_connection = ConnectHandler(device_type=dev_type, ip=host, username=user, password=passwd, port = port)
        print (f'Connected to {host},running commands\n')
    
        if ssh_connection.is_alive():
            try:
                for command in commands:
                    print(f"Running: {command}...")
                    output = ssh_connection.send_command(command)
                    print(output)
            except:
                print(f"Error on {host} running command: {command}")
    except Exception as e:
        print(f'Error connecting to {host}: {e}')