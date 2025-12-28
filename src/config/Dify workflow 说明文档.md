# 执行 workflow

> 执行 workflow，没有已发布的 workflow，不可执行。



## OpenAPI

````yaml zh/api-reference/openapi_workflow.json post /workflows/run
openapi: 3.0.1
info:
  title: Workflow 应用 API
  description: Workflow 应用无会话支持，适合用于翻译/文章写作/总结 AI 等等。
  version: 1.0.0
servers:
  - url: '{api_base_url}'
    description: API 的基础 URL。请将 {api_base_url} 替换为你的应用提供的实际 API 基础 URL。
    variables:
      api_base_url:
        default: https://api.dify.ai/v1
        description: 实际的 API 基础 URL
security:
  - ApiKeyAuth: []
tags:
  - name: 工作流执行
    description: 与执行和管理工作流相关的操作。
  - name: 文件操作 (工作流)
    description: 特定于工作流的文件上传和预览操作。
  - name: 应用配置 (Workflow)
    description: 工作流应用的应用设置和信息。
paths:
  /workflows/run:
    post:
      tags:
        - 工作流执行
      summary: 执行 workflow
      description: 执行 workflow，没有已发布的 workflow，不可执行。
      operationId: executeWorkflowCn
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WorkflowExecutionRequestCn'
            examples:
              basic_execution_cn:
                summary: 基础工作流执行示例
                value:
                  inputs:
                    query: 请总结这段文字：...
                  response_mode: streaming
                  user: workflow_user_001
              with_file_array_variable_cn:
                summary: 包含文件列表变量的输入示例
                value:
                  inputs:
                    my_documents:
                      - type: document
                        transfer_method: local_file
                        upload_file_id: 已上传的文件ID_abc
                      - type: image
                        transfer_method: remote_url
                        url: https://example.com/image.jpg
                  response_mode: blocking
                  user: workflow_user_002
      responses:
        '200':
          description: >-
            工作流执行成功。响应结构取决于 `response_mode`。

            - `blocking`: `application/json` 格式，包含
            `WorkflowCompletionResponseCn` 对象。

            - `streaming`: `text/event-stream` 格式，包含 `ChunkWorkflowEventCn` 事件流。
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowCompletionResponseCn'
            text/event-stream:
              schema:
                type: string
                description: >-
                  SSE 事件流。每个事件以 'data: ' 开头，以 '\n\n' 结尾。具体结构请参见
                  `ChunkWorkflowEventCn`。
        '400':
          $ref: '#/components/responses/BadRequestWorkflowCn'
        '500':
          $ref: '#/components/responses/InternalServerErrorCn'
components:
  schemas:
    WorkflowExecutionRequestCn:
      type: object
      required:
        - inputs
        - response_mode
        - user
      properties:
        inputs:
          type: object
          description: >-
            允许传入 App 定义的各变量值。如果变量是文件列表类型，该变量对应的值应是 InputFileObjectWorkflowCn
            对象的列表。
          additionalProperties:
            oneOf:
              - type: string
              - type: number
              - type: boolean
              - type: object
              - type: array
                items:
                  $ref: '#/components/schemas/InputFileObjectWorkflowCn'
          example:
            user_query: 请帮我翻译这句话。
            target_language: 法语
        response_mode:
          type: string
          enum:
            - streaming
            - blocking
          description: >-
            返回响应模式。streaming (推荐) 基于 SSE；blocking 等待执行完毕后返回 (Cloudflare
            100秒超时限制)。
        user:
          type: string
          description: 用户标识，应用内唯一。
    WorkflowCompletionResponseCn:
      type: object
      description: 阻塞模式下的 workflow 执行结果。
      properties:
        workflow_run_id:
          type: string
          format: uuid
          description: workflow 执行 ID。
        task_id:
          type: string
          format: uuid
          description: 任务 ID。
        data:
          $ref: '#/components/schemas/WorkflowFinishedDataCn'
    InputFileObjectWorkflowCn:
      type: object
      required:
        - type
        - transfer_method
      properties:
        type:
          type: string
          enum:
            - document
            - image
            - audio
            - video
            - custom
          description: >-
            文件类型。document: TXT,MD,PDF等; image: JPG,PNG等; audio: MP3,WAV等; video:
            MP4,MOV等; custom: 其他。
        transfer_method:
          type: string
          enum:
            - remote_url
            - local_file
          description: 传递方式，remote_url 用于图片 URL / local_file 用于文件上传
        url:
          type: string
          format: url
          description: 图片地址（当传递方式为 remote_url 时）
        upload_file_id:
          type: string
          description: 上传文件 ID，必须通过事先上传文件接口获得（当传递方式为 local_file 时）
      anyOf:
        - properties:
            transfer_method:
              enum:
                - remote_url
            url:
              type: string
              format: url
          required:
            - url
          not:
            required:
              - upload_file_id
        - properties:
            transfer_method:
              enum:
                - local_file
            upload_file_id:
              type: string
          required:
            - upload_file_id
          not:
            required:
              - url
    WorkflowFinishedDataCn:
      type: object
      description: Workflow 执行结束事件的详细内容。
      required:
        - id
        - workflow_id
        - status
        - created_at
        - finished_at
      properties:
        id:
          type: string
          format: uuid
          description: workflow 执行 ID。
        workflow_id:
          type: string
          format: uuid
          description: 关联 Workflow ID。
        status:
          type: string
          enum:
            - running
            - succeeded
            - failed
            - stopped
          description: 执行状态。
        outputs:
          type: object
          additionalProperties: true
          nullable: true
          description: （可选）输出内容 (JSON)。
        error:
          type: string
          nullable: true
          description: （可选）错误原因。
        elapsed_time:
          type: number
          format: float
          nullable: true
          description: （可选）耗时(秒)。
        total_tokens:
          type: integer
          nullable: true
          description: （可选）总使用 tokens。
        total_steps:
          type: integer
          default: 0
          description: 总步数，默认 0。
        created_at:
          type: integer
          format: int64
          description: 开始时间。
        finished_at:
          type: integer
          format: int64
          description: 结束时间。
    ErrorResponseCn:
      type: object
      description: 错误响应。
      properties:
        status:
          type: integer
          nullable: true
          description: HTTP 状态码。
        code:
          type: string
          nullable: true
          description: 错误码。
        message:
          type: string
          description: 错误消息。
  responses:
    BadRequestWorkflowCn:
      description: >-
        请求参数错误或工作流执行失败。可能错误码：invalid_param, app_unavailable,
        provider_not_initialize, provider_quota_exceeded,
        model_currently_not_support, workflow_request_error。
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponseCn'
    InternalServerErrorCn:
      description: 服务内部异常。
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponseCn'
  securitySchemes:
    ApiKeyAuth:
      type: http
      scheme: bearer
      bearerFormat: API_KEY
      description: >-
        API-Key 鉴权。所有 API 请求都应在 Authorization HTTP Header 中包含你的
        API-Key，格式为：Bearer {API_KEY}。强烈建议开发者把 API-Key 放在后端存储，而非客户端，以免泄露。

````

---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.dify.ai/llms.txt