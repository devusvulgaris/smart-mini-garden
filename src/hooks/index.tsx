import { useCallback, useEffect } from "react";
import mqtt from "mqtt";
import { CLIENT_ID, CONNECTION_STATUS, TOPICS } from "@/constants";
import useStore from "@/store";

const clientId = CLIENT_ID + Math.random().toString(16).substring(2, 8);
const username = process.env.NEXT_PUBLIC_EMQX_USER;
const password = process.env.NEXT_PUBLIC_EMQX_PASSWORD;

const address = `wss://${process.env.NEXT_PUBLIC_MQTT_HOST}:${process.env.NEXT_PUBLIC_WSS_PORT}/mqtt`;

const options = {
  clientId,
  username,
  password,
  clean: true,
  reconnectPeriod: 1000, // ms
  connectTimeout: 10 * 1000, // ms
};

export default function useMqttClient() {
  const {
    client,
    setClient,
    connectionStatus,
    setConnectionStatus,
    setTemperature,
    setHumidity,
    setMoisture,
    setIsSubscribed,
  } = useStore(
    ({
      client,
      setClient,
      connectionStatus,
      setConnectionStatus,
      setTemperature,
      setHumidity,
      setMoisture,
      setIsSubscribed,
    }) => ({
      client,
      setClient,
      connectionStatus,
      setConnectionStatus,
      setTemperature,
      setHumidity,
      setMoisture,
      setIsSubscribed,
    })
  );

  const connect = () => {
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);

    try {
      const mqttClient = mqtt.connect(address, options);
      setClient(mqttClient);
    } catch (err) {
      console.warn("[ERR]", err);
    }
  };

  const disconnect = () => {
    if (client) {
      try {
        client.end(false, () => {
          setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
          console.log("disconnected successfully");
        });
      } catch (error) {
        console.log("disconnect error:", error);
      }
    }
  };

  const subscribe = useCallback(
    (subscription) => {
      if (client) {
        const { topic, qos } = subscription;

        client.subscribe(topic, { qos }, (error) => {
          if (error) {
            console.log("Subscribe to topic error:", error);
          }
          console.log(`Subscribed to topic ${topic}`);
          setIsSubscribed(true);
        });
      }
    },
    [client, setIsSubscribed]
  );

  const publish = useCallback(
    ({ topic, message }) => {
      console.log("client??", client);
      if (client) {
        console.log("publishing??", client);
        client.publish(topic, message, { qos: 0 }, (error) => {
          if (error) {
            console.log("Publish error", error);
          }

          console.log("published", topic, "message", message);
        });
      }
    },
    [client]
  );

  useEffect(() => {
    if (client) {
      client.on("connect", () => {
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        console.log("connected");
      });

      client.on("reconnect", () => {
        console.log("reconnecting");
        setConnectionStatus(CONNECTION_STATUS.RECONNECTING);
      });

      client.on("error", (err) => {
        console.warn("ERRR", err);
      });

      client.on("message", (topic, message) => {
        console.log(`received message: ${message} from topic: ${topic}`);
        console.log("msg", message.toString());
        console.log("topic", topic);
        switch (topic) {
          case TOPICS.TEMPERATURE:
            setTemperature(message.toString());
          case TOPICS.HUMIDITY:
            setHumidity(message.toString());
          case TOPICS.MOISTURE:
            setMoisture(message.toString());
          default:
            return;
        }
      });
    }
  }, [client, setConnectionStatus, setHumidity, setMoisture, setTemperature]);

  useEffect(() => {
    if (connectionStatus === CONNECTION_STATUS.CONNECTED) {
      subscribe({
        topic: TOPICS.TEMPERATURE,
        qos: 0,
      });
      subscribe({
        topic: TOPICS.HUMIDITY,
        qos: 0,
      });
      subscribe({
        topic: TOPICS.MOISTURE,
        qos: 0,
      });
    }
  }, [connectionStatus, subscribe]);

  return {
    connect,
    disconnect,
    subscribe,
    publish,
  };
}
