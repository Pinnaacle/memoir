# Diagrams

## Routing And Navigation

```mermaid
flowchart TD
  Root["Root Stack"]
  Tabs["(tabs)"]
  Timeline["Timeline"]
  Moments["Moments"]
  Events["Events"]
  Chapters["Chapters"]
  Memories["Memories"]
  New["moments/new"]
  Detail["moments/[id]"]

  Root --> Tabs
  Tabs --> Timeline
  Tabs --> Moments
  Tabs --> Events
  Tabs --> Chapters
  Tabs --> Memories
  Root --> New
  Root --> Detail
  Moments ~~~ New
  Moments ~~~ Detail
```



## Data Model

```mermaid
erDiagram
  GROUPS {
    uuid id
    text name
    string ...
  }

  MOMENTS {
    uuid id
    uuid group_id
    text title
    string ...
  }

  PHOTOS {
    uuid id
    uuid group_id
    text storage_path
    string ...
  }

  GROUPS ||--o{ MOMENTS : scopes
  GROUPS ||--o{ PHOTOS : scopes
```



## App Layers

```mermaid
flowchart LR
  Service["service"]
  Hook["hook"]
  UI["UI"]
  Screen["screen"]

  Service --> Hook --> UI --> Screen
```



## Moment Image Flow

```mermaid
flowchart LR
  Picker["AddImageField\nhandleAddImages"]
  UploadState["useImageUpload\nstartUpload"]
  Storage["imageUpload\nuploadEntityImage"]
  Database["moments service\ncreateMoment"]

  Picker --> UploadState
  UploadState --> Storage
  Storage --> Database
```



