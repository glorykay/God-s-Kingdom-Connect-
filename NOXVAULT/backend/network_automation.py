from netmiko import ConnectHandler

# -----------------------------
# DEVICE DICTIONARIES
# -----------------------------

# Router 1 (Cisco IOS, SSH key)
rt1_cisco = {
    "device_type": "cisco_ios",
    "host": "10.0.0.1",
    "username": "admin",
    "use_keys": True,
    "key_file": "/home/user/.ssh/rt1_key",   # fake path is fine
    "secret": "cisco_enable_pw"
}

# Router 2 (Cisco IOS, SSH key)
rt2_cisco = {
    "device_type": "cisco_ios",
    "host": "10.0.0.2",
    "username": "admin",
    "use_keys": True,
    "key_file": "/home/user/.ssh/rt2_key",   # fake path is fine
    "secret": "cisco_enable_pw"
}

# Switch 1 (HP but assignment says use Cisco IOS device_type)
sw1_hp = {
    "device_type": "cisco_ios",
    "host": "10.0.0.3",
    "username": "admin",
    "password": "hp_switch_pw",
    "secret": "hp_enable_pw"
}

# -----------------------------
# ROUTER LIST
# -----------------------------
rt_list = [rt1_cisco, rt2_cisco]

# -----------------------------
# ROUTER COMMANDS
# -----------------------------
rt_commands = [
    "show version",
    "ip route 192.168.100.0 255.255.255.0 10.10.10.10",
    "show ip route"
]

# -----------------------------
# SWITCH COMMANDS (GENERATED)
# -----------------------------
sw_commands = []

for number in range(2, 7):  # 2–6
    sw_commands.append(f"vlan {number}")
    sw_commands.append(f"vlan {number} usernet{number}")
    sw_commands.append(f"tagged {number}")

# -----------------------------
# SEND COMMANDS TO ROUTERS
# -----------------------------
for router in rt_list:
    print(f"\nConnecting to router: {router['host']}")
    net_connect = ConnectHandler(**router)
    net_connect.enable()

    output = net_connect.send_config_set(rt_commands)
    print(output)

    net_connect.disconnect()

# -----------------------------
# SEND COMMANDS TO SWITCH
# -----------------------------
print("\nConnecting to switch:", sw1_hp["host"])
sw_connect = ConnectHandler(**sw1_hp)
sw_connect.enable()

sw_output = sw_connect.send_config_set(sw_commands)
print(sw_output)

sw_connect.disconnect()
