import {Construct} from "constructs";
import {aws_ec2, aws_ssm} from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import {PrivateProps} from "./code-stack";

export class BootstrapContent {
    static bootstrapCommand = [
        'echo "bootstrap started"',
        // Create directories
        'mkdir /opt/steam',
        'mkdir /palworld-server',

        // Install software
        'echo "[INFO] INSTALLING SOFTWARE"',
        'sudo apt-get update',
        'sudo apt-get install -y curl lib32gcc1 lsof git awscli',

        // Install steam cmd
        'echo "[INFO] DOWNLOADING AND INSTALLING STEAM CMD"',
        'wget -P /opt/steam https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz',
        'yes "" | sudo add-apt-repository multiverse',
        'yes "" | sudo dpkg --add-architecture i386',
        'sudo apt update',
        'tar -xzf /opt/steam/steamcmd_linux.tar.gz -C /opt/steam ',
        'chmod 755 /opt/steam/steamcmd.sh',
        // sudo apt install -y steamcmd

        // Create steam user
        'echo "[INFO] CREATING STEAM USER"',
        'useradd -m -U steam',
        'chown -R steam:steam /palworld-server',

        // Setup the steam cmd command to download Palworld
        'echo "[INFO] SETTING UP STEAMCMD INSTALLER TO DOWNLOAD PALWORLD"',
        'sudo chown -R steam:steam /opt/steam',
        //cat <<EOF > /opt/steam/download-palworld.txt
        'echo "@NoPromptForPassword 1\nforce_install_dir /palworld-server\nlogin anonymous\napp_update 2394010 validate\nquit" > /opt/steam/download-palworld.txt',
        // Run steam cmd to download PALWORLD
        'echo "[INFO] DOWNLOADING PALWORLD"',
        'sudo -u steam /opt/steam/steamcmd.sh +runscript /opt/steam/download-palworld.txt',

        'sudo -u steam mkdir -p /home/steam/.steam/sdk64/',
        'sudo -u steam /opt/steam/steamcmd.sh +login anonymous +app_update 1007 +quit',

        // Give steamcmd.sh time to do its magic before trying to copy the files that above command downloads
        'sleep 60',

        'sudo -u steam cp "/home/steam/Steam/steamapps/common/Steamworks SDK Redist/linux64/steamclient.so" /home/steam/.steam/sdk64/',

        // Install the systemd service file for PALWORLD Dedicated Server
        'echo "[INFO] CREATING SYSTEMD SERVICE PALWORLD"',
        // cat > /etc/systemd/system/palworld.service <<EOF
        'sudo echo "[Unit]\nDescription=Palworld Dedicated Server\nAfter=network.target\n\n[Service]\nType=simple\nLimitNOFILE=10000\nUser=steam\nGroup=steam\nExecStartPre=/opt/steam/steamcmd.sh +runscript /opt/steam/download-palworld.txt\nWorkingDirectory=/palworld-server\nExecStart=/palworld-server/PalServer.sh EpicApp=PalServer\n\nRestart=on-failure\nRestartSec=20s\n\n[Install]\nWantedBy=multi-user.target" > /etc/systemd/system/palworld.service',

        'sudo mkdir -p /palworld-server/Pal/Saved/Config/LinuxServer/',
        'sudo echo "[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(Difficulty=${difficulty},DayTimeSpeedRate=${day_time_speed_rate},NightTimeSpeedRate=${night_time_speed_rate},ExpRate=${exp_rate},PalCaptureRate=${pal_capture_rate},PalSpawnNumRate=${pal_spawn_num_rate},PalDamageRateAttack=${pal_damage_rate_attack},PalDamageRateDefense=${pal_damage_rate_defense},PlayerDamageRateAttack=${player_damage_rate_attack},PlayerDamageRateDefense=${player_damage_rate_defense},PlayerStomachDecreaceRate=${player_stomach_decrease_rate},PlayerStaminaDecreaceRate=${player_stamina_decrease_rate},PlayerAutoHPRegeneRate=${player_auto_hp_regen_rate},PlayerAutoHpRegeneRateInSleep=${player_auto_hp_regen_rate_in_sleep},PalStomachDecreaceRate=${pal_stomach_decrease_rate},PalStaminaDecreaceRate=${pal_stamina_decrease_rate},PalAutoHPRegeneRate=${pal_auto_hp_regen_rate},PalAutoHpRegeneRateInSleep=${pal_auto_hp_regene_rate_in_sleep},BuildObjectDamageRate=${build_object_damage_rate},BuildObjectDeteriorationDamageRate=${build_object_deterioration_damage_rate},CollectionDropRate=${collection_drop_rate},CollectionObjectHpRate=${collection_object_hp_rate},CollectionObjectRespawnSpeedRate=${collection_object_respawn_speed_rate},EnemyDropItemRate=${enemy_drop_item_rate},DeathPenalty=${death_penalty},bEnablePlayerToPlayerDamage=${enable_player_to_player_damage},bEnableFriendlyFire=${enable_friendly_fire},bEnableInvaderEnemy=${enable_invader_enemy},bActiveUNKO=${active_unko},bEnableAimAssistPad=${enable_aim_assist_pad},bEnableAimAssistKeyboard=${enable_aim_assist_keyboard},DropItemMaxNum=${drop_item_max_num},DropItemMaxNum_UNKO=${drop_item_max_num_unko},BaseCampMaxNum=${base_camp_max_num},BaseCampWorkerMaxNum=${base_camp_worker_max_num},DropItemAliveMaxHours=${drop_item_alive_max_hours},bAutoResetGuildNoOnlinePlayers=${auto_reset_guild_no_online_players},AutoResetGuildTimeNoOnlinePlayers=${auto_reset_guild_time_no_online_players},GuildPlayerMaxNum=${guild_player_max_num},PalEggDefaultHatchingTime=${pal_egg_default_hatching_time},WorkSpeedRate=${work_speed_rate},bIsMultiplay=${is_multiplay},bIsPvP=${is_pvp},bCanPickupOtherGuildDeathPenaltyDrop=${can_pickup_other_guild_death_penalty_drop},bEnableNonLoginPenalty=${enable_non_login_penalty},bEnableFastTravel=${enable_fast_travel},bIsStartLocationSelectByMap=${is_start_location_select_by_map},bExistPlayerAfterLogout=${exist_player_after_logout},bEnableDefenseOtherGuildPlayer=${enable_defense_other_guild_player},CoopPlayerMaxNum=${coop_player_max_num},ServerPlayerMaxNum=${server_player_max_num},ServerName="${server_name}",ServerDescription="${server_description}",%{ if admin_password != "" ~}AdminPassword="${admin_password}",%{ else ~}AdminPassword="",%{ endif ~}%{ if server_password != "" ~}ServerPassword="${server_password}",%{ else ~}ServerPassword="",%{ endif ~}PublicPort=${public_port},%{ if public_ip != "" ~}PublicIP="${public_ip}",%{ else ~}PublicIP="",%{ endif ~}RCONEnabled=${enable_rcon},%{ if rcon_port != "" ~}RCONPort=${rcon_port},%{ else ~}RCONPort="",%{ endif ~}%{ if region != "" ~}Region="${region}",%{ else ~}Region="",%{ endif ~}bUseAuth=${use_auth},BanListURL="${ban_list_url}")" > /palworld-server/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini',

        'chown -R steam:steam /palworld-server/Pal/Saved',
        'chmod -R 775 /palworld-server/Pal/Saved',

        'systemctl daemon-reload',
        'echo "[INFO] ENABLING PALWORLD.SERVICE"',
        'systemctl enable palworld',
        'echo "[INFO] STARTING PALWORLD.SERVICE"',
        'systemctl start palworld'

    ]

    static resolveKeyPair(scope: Construct, region: string, props: PrivateProps){
        const toCreate: string = props.createBucket;
        if(toCreate === 'true') {
            return new aws_ec2.KeyPair(scope, "pal-server-keypair", {
                keyPairName: `pal-server-keypair-${region}`,
            })
        }else{
            return aws_ec2.KeyPair.fromKeyPairName(scope, "pal-server-keypair", `pal-server-keypair-${region}`)
        }
    }

    static resolveS3Bucket(scope: Construct, region: string, accountId: string, props: PrivateProps){
        const toCreate: string = props.createKeyPair;
        const bucketName: string = props.bucketName || `palworld-cdk-demo-${accountId}-${region}`;
        if(toCreate === 'true') {
            return new s3.Bucket(scope, `palworld-cdk-demo-${accountId}`, {
                // default is already blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                autoDeleteObjects: true,
                bucketName: bucketName,
            });
        }
        else{
            return s3.Bucket.fromBucketArn(scope, `palworld-cdk-demo-${accountId}`,`arn:aws:s3:::${bucketName}`);
        }
    }

    static resolvePrivateProps(){
        let createKeyPair= process.env.CREATE_KEYPAIR || 'false';
        let createBucket= process.env.CREATE_BUCKET || 'false';
        let bucketName= process.env.BUCKET_NAME;
        let serverName= process.env.SERVER_NAME || 'palworld-game-server';
        return {createKeyPair, createBucket, bucketName, serverName}
    }
}