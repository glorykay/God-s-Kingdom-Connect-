from netmiko import ConnectHandler

device_info = {
    "device_type": "cisco_ios",
    "host": "10.10.10.1",
    "username": "admin",
    "password": "password1234",
    "secert": "pickl3s"
}

ssh_connection = ConnectHandler(**device_info)

result = ssh_connection.send_command("show version")
print(result)

ssh_connection.enable()
conf_commands = ["ip default-gateway 10.10.0.1", "username superman privilege 15 password clarkKent"]

result = ssh_connection.send_config_set(conf_commands)
print(result)
ssh_connection.disconnect()