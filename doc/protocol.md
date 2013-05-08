# VistaTV APIs and Protocols

This document describes the APIs and protocols implemented by the stats server that the web application uses to obtain data.

The stats server provides two interfaces:

* An HTTP interface, on port 8083 by default. This is described in the [HTTP API](#http-api) section.
* A TCP socket interface, on port 8081 by default, using the stats protocol described in this document. This is described in the [Stats protocol](#stats-protocol) section.

Note that the web application uses a configuration file `conf/config.yml` to obtain the hostname and port of the stats server HTTP and TCP socket interfaces. An example configuration file is provided: `conf/config.yml.example`.

## <a id="http-api"></a>HTTP API

The stats server HTTP API provides the following methods:

### <a id="get-discovery"></a> GET /discovery.json

Returns a list of all available TV and radio streams (stations). The response is a JSON-encoded array, as described in [Discovery data](#discovery-data-structure) in the [Data structures](#data-structures) section.

#### Example response

    [
      {
        "id": "bbc_radio_two"
      },
      {
        "id": "bbc_radio_five_live"
      },
      // etc...
    ]

### <a id="get-historical"></a> GET /:stream_id/historical.json

Returns stream statistics for the last hour for a single TV or radio stream. Replace `:stream_id` in the URL with a valid TV or radio stream identifier, as returned by [`GET /discovery.json`](#get-discovery).

The response is a JSON-encoded object, as described in [Overview data](#overview-data-structure) in the [Data structures](#data-structures) section. The object contains statistics for each minute in the last hour for a single stream (station).

#### Example response

    {
      "timestamp": "2013-04-29T10:09:47Z",
      "stations": {
        "bbc_radio_one": [
          {
            "timestamp": "2013-04-29T09:11:00Z",
            "audience": {
              "total": 20368,
              "join": 273,
              "quit": 180,
              "change": 93,
              "platforms": {
                "desktop": 2472,
                "mobile": 1927,
                "console": 0,
                "stb_tv": 0,
                "other": 99
              }
            },
            "flux": {
              "from": {
                "bbc_radio_two": 3,
                "bbc_1xtra": 2
              },
              "to": {
                "bbc_1xtra": 7,
                "bbc_6music": 1,
                "bbc_radio_oxford": 1
              },
              "arrived": 5,
              "left": 9
            },
            "programme": {
              "id": "b01ryzwf",
              "title": "Sara Cox"
            }
          },
          // etc. (one entry per minute over the last hour)
        ]
      }
    }

## <a id="stats-protocol"></a>Stats protocol

The stats protocol is used to asynchronously notify the web application server when new stream statistics become available.

The protocol is a textual line-oriented protocol, i.e., each command and response message is a single line of text, and lines are separated by a carriage-return, line-feed pair.

### Commands

#### <a id="overview-command"></a> Overview

The client sends an `overview` command to request the server to start sending overview data. After receiving this command, the server responds periodically (once every minute) with an [Overview data](#overview-data) message containing statistics for all available streams.

    overview

#### Stop overview

The client sends a `stop_overview` command to request the server to stop sending overview data.

    stop_overview

In response to this command, the server replies with an [Overview stopped](#overview-stopped) message.

### Responses

Response messages contain three fields delimited by pipe characters, `"|"`, denoted **message-type**, **command**, and **message-content**.

The **message-type** is either `DATA`, `ACK`, or `OK`. The **command** is the same as was sent by the client. The **message-content** is a JSON-encoded object, the structure of which is dependent on the **message-type** and **command** field values, as described below.

#### <a id="overview-data"></a> Overview data

This message is sent by the server once per minute after receiving an `overview` command from the client.

    DATA|overview|{{"timestamp":"2013-04-29T10:18:06Z","stations":{ ... }}}

The **message-content** field contains a JSON-encoded object, the structure of which is described in [Overview data](#overview-data-structure) in the [Data structures](#data-structures) section.

##### Example message content

    {
      "timestamp": "2013-04-29T10:09:47Z",
      "stations": {
        "bbc_radio_one": [
          {
            "timestamp": "2013-04-29T09:11:00Z",
            "audience": {
              "total": 20368,
              "join": 273,
              "quit": 180,
              "change": 93,
              "platforms": {
                "desktop": 2472,
                "mobile": 1927,
                "console": 0,
                "stb_tv": 0,
                "other": 99
              }
            },
            "flux": {
              "from": {
                "bbc_radio_two": 3,
                "bbc_1xtra": 2
              },
              "to": {
                "bbc_1xtra": 7,
                "bbc_6music": 1,
                "bbc_radio_oxford": 1
              },
              "arrived": 5,
              "left": 9
            },
            "programme": {
              "id": "b01ryzwf",
              "title": "Sara Cox"
            }
          }
        ],
        "bbc_radio_two": [
          {
            "timestamp": "2013-04-29T09:11:00Z",
            "audience": {
              // etc. (structure as for bbc_radio_one)
            },
            "flux": {
              // etc. (structure as for bbc_radio_one)
            },
            "programme": {
              // etc. (structure as for bbc_radio_one)
            }
          }
        ],
        // etc. (one entry for each TV or radio stream)
      }
    }

#### <a id="overview-stopped"></a> Overview stopped

This message is sent by the server in response to a `stop_overview` command from the client, to confirm that overview messages have been stopped.

    OK|stop_overview|{}

#### Error

This message is sent if the server receives an unrecognised command.

    ACK|unknown|{"error":"unknown not understood"}

## <a id="data-structures"></a> Data structures

### <a id="discovery-data-structure"></a> Discovery data

Discovery data is encoded as a JSON array, in which each element is an object containing information about a single TV or radio stream. Each object contains the following fields:

| Field | Description                                      |
| ----- | -----------                                      |
| id    | The unique identifier for the TV or radio stream |

### <a id="overview-data-structure"></a> Overview data

Stream statistics data are encoded as a JSON object, with entries for one or more streams. The same data structure is used for both [`GET /:stream_id/historical.json`](#get-historical) in the HTTP API and in `overview` messages in the TCP stats protocol, although the content of the data differs between the two.

The top-level object contains the following fields:

| Field     | Description                                                         |
| -----     | -----------                                                         |
| timestamp | The time when this response or message was generated                |
| stations  | An object containing stats data for one or more streams (see below) |

The `stations` object is keyed by TV or radio stream identifier and contains an entry for one or more TV or radio streams.
In the case of the [`GET /:stream_id/historical.json`](#get-historical) request, the `stations` object contains only one key, corresponding to the `:stream_id` request parameter.
In the case of the stats protocol [`overview`](#overview-command) message, the `stations` object contains one entry for each available stream.

The value for each key is an array of data relating to the corresponding stream. Each entry in this array is an object containing stats for a one-minute time period.
In the case of the [`GET /:stream_id/historical.json`](#get-historical) request, the array contains 60 entries, one for each minute in the last hour.
In the case of the stats protocol [`overview`](#overview-command) message, the array contains one entry, containing the statistics from the last minute.

Each array entry is an object containing the following fields:

| Field     | Description                                                                                     |
| -----     | -----------                                                                                     |
| timestamp | The time that the stream stats were generated                                                   |
| audience  | An object containing data on the number of clients viewing this stream                          |
| flux      | An object containing data on clients leaving and joining this stream                            |
| programme | An object containing information on the programme playing on this stream at the given timestamp |

Each `audience` object contains the following fields:

| Field     | Description                                                                                   |
| -----     | -----------                                                                                   |
| total     | The total number of clients viewing / listening to this stream                                |
| join      | The number of clients who joined this stream since the last update                            |
| quit      | The number of clients who left this stream since the last update                              |
| change    | The difference between the join and quit values                                               |
| platforms | An object containing a breakdown of the number of clients by platform (type of client device) |

The `platforms` object contains the following fields:

| Field   | Description                 |
| -----   | -----------                 |
| desktop | Desktop and laptop PCs      |
| mobile  | Smartphones                 |
| console | Games consoles              |
| stb_tv  | Smart TVs and set-top boxes |
| other   | Other devices               |

The `flux` object contains the following fields:

| Field   | Description                                                                                                                                                                                                          |
| -----   | -----------                                                                                                                                                                                                          |
| from    | An object containing counts of the number of clients that joined this stream from other streams. Keys in this object are station identifiers, and the values are number of clients that joined from those stations   |
| to      | An object containing counts of the number of clients that left this stream to join other streams. Keys in this object are station identifiers, and the values are number of clients that left to join those stations |
| arrived | The total number of clients that joined this stream from another stream                                                                                                                                              |
| left    | The total number of clients that left this stream to join another stream                                                                                                                                             |

The `programme` object contains the following fields:

| Field   | Description                           |
| -----   | -----------                           |
| id      | A unique identifier for the programme |
| title   | The programme title                   |

## Copyright

Copyright 2013 British Broadcasting Corporation
