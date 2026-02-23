# 需求文档：Rust 音频引擎架构

## 简介

本项目旨在将现有的 Lumison 音乐播放器（基于 Tauri + TypeScript + React）重构为一个工程化的混合架构音乐系统。通过将音频核心功能迁移到 Rust 层，实现高性能、低延迟的音频处理能力，同时保持前端的灵活性和可扩展性。

本文档定义的是 MVP（最小可行产品）版本，专注于核心音频功能和可扩展架构基础。高级特性和性能优化将在后续迭代中实现。目标是在 3-6 个月内完成一个功能完整、架构清晰、可展示的音频引擎系统。

## 术语表

### 核心组件
- **Audio_Engine**: Rust 实现的音频引擎核心模块，负责音频解码、DSP 处理和输出
- **Frontend**: TypeScript/React 实现的前端层，负责 UI 和状态管理
- **IPC_Bridge**: Tauri IPC 通信桥接层，连接前端和 Rust 后端
- **DSP_Pipeline**: 数字信号处理管线，包含基础音频效果器（均衡器、淡入淡出、音量控制）
- **Plugin_System**: 插件系统基础架构，定义插件接口和加载机制
- **Audio_Database**: SQLite 数据库，由 Rust 管理，存储音乐库元数据和播放历史

### 线程模型
- **Decoder_Thread**: 音频解码线程，负责将音频文件解码为 PCM 数据
- **DSP_Thread**: DSP 处理线程，负责对音频数据进行实时处理
- **Output_Thread**: 音频输出线程，负责将处理后的音频数据发送到音频设备

### 技术依赖
- **Rodio**: Rust 音频播放库，提供高级音频播放抽象
- **CPAL**: 跨平台音频库，提供底层音频设备访问
- **Symphonia**: Rust 音频解码库，支持多种音频格式
- **SQLite**: 嵌入式关系数据库，用于元数据存储

## 需求

### 需求 1：Rust 音频引擎核心架构

**用户故事：** 作为系统架构师，我希望建立一个基于 Rust 的音频引擎核心，以便实现高性能、低延迟的音频处理能力。

#### 验收标准

1. THE Audio_Engine SHALL 使用 Rodio 或 CPAL 作为音频输出后端
2. THE Audio_Engine SHALL 支持至少 MP3、FLAC、WAV 三种音频格式的解码
3. THE Audio_Engine SHALL 实现多线程架构，包含 Decoder_Thread、DSP_Thread 和 Output_Thread
4. THE Audio_Engine SHALL 通过 IPC_Bridge 向 Frontend 暴露播放控制接口（播放、暂停、停止、跳转）
5. WHEN 音频文件加载失败时，THE Audio_Engine SHALL 返回详细的错误信息给 Frontend
6. THE Audio_Engine SHALL 维护音频缓冲区，确保播放流畅性（缓冲区大小可配置，默认 2048 采样）
7. THE Audio_Engine SHALL 支持基础采样率（44.1kHz 和 48kHz）

### 需求 2：DSP 处理管线

**用户故事：** 作为音频工程师，我希望实现一个可扩展的 DSP 处理管线，以便对音频进行实时效果处理。

#### 验收标准

1. THE DSP_Pipeline SHALL 支持链式效果器架构，允许动态添加和移除效果器
2. THE DSP_Pipeline SHALL 实现基础均衡器（支持 5 段频率调节：低音、中低音、中音、中高音、高音）
3. WHEN 切换歌曲时，THE DSP_Pipeline SHALL 应用淡入淡出效果（淡出时长 500ms，淡入时长 500ms）
4. THE DSP_Pipeline SHALL 实现音量控制功能（0-100% 线性调节）
5. THE DSP_Pipeline SHALL 在独立线程中运行，避免阻塞音频输出
6. THE DSP_Pipeline SHALL 支持实时参数调整，延迟不超过 50ms

### 需求 3：前后端通信协议

**用户故事：** 作为系统集成工程师，我希望定义清晰的前后端通信协议，以便实现高效的数据交换。

#### 验收标准

1. THE IPC_Bridge SHALL 使用 Tauri 的 invoke 机制进行命令调用
2. THE IPC_Bridge SHALL 使用 Tauri 的 emit 机制进行事件推送
3. THE IPC_Bridge SHALL 定义标准化的消息格式（JSON Schema 验证）
4. WHEN 音频状态变化时（播放、暂停、停止），THE Audio_Engine SHALL 通过 IPC_Bridge 发送事件给 Frontend
5. THE IPC_Bridge SHALL 实现请求超时机制（默认超时 5 秒）
6. WHEN IPC 调用失败时，THE IPC_Bridge SHALL 返回错误信息给调用方

### 需求 4：音频数据库管理

**用户故事：** 作为数据管理员，我希望使用 Rust 管理音乐库数据库，以便实现高效的元数据存储和查询。

#### 验收标准

1. THE Audio_Database SHALL 使用 SQLite 作为存储引擎
2. THE Audio_Database SHALL 存储音乐文件的元数据（标题、艺术家、专辑、时长、文件路径）
3. THE Audio_Database SHALL 存储播放历史记录（播放时间、播放次数）
4. THE Audio_Database SHALL 支持基础搜索功能（按标题、艺术家、专辑搜索）
5. WHEN 音乐文件被添加时，THE Audio_Database SHALL 自动提取并存储 ID3 标签信息
6. THE Audio_Database SHALL 支持事务操作，确保数据一致性

### 需求 5：插件系统基础架构

**用户故事：** 作为插件开发者，我希望系统提供插件接口定义，以便未来扩展音频处理功能。

#### 验收标准

1. THE Plugin_System SHALL 定义标准化的音频处理接口（输入 PCM 数据，输出处理后的 PCM 数据）
2. THE Plugin_System SHALL 定义插件元数据格式（名称、版本、作者、描述）
3. THE Plugin_System SHALL 提供插件注册机制，允许插件向系统注册
4. THE Plugin_System SHALL 定义插件生命周期接口（初始化、处理、清理）
5. THE Plugin_System SHALL 提供基础的插件加载机制（从指定目录加载插件配置）
6. WHEN 插件接口被调用时，THE Plugin_System SHALL 验证输入数据的有效性

### 需求 6：音频格式解码器

**用户故事：** 作为音频工程师，我希望支持常见音频格式的解码，以便用户可以播放主流格式的音乐文件。

#### 验收标准

1. THE Audio_Engine SHALL 使用 Symphonia 库进行音频解码
2. THE Audio_Engine SHALL 支持 MP3 格式解码（支持 CBR、VBR）
3. THE Audio_Engine SHALL 支持 FLAC 格式解码（支持 16-bit、24-bit）
4. THE Audio_Engine SHALL 支持 WAV 格式解码（支持 PCM）
5. WHEN 遇到不支持的音频格式时，THE Audio_Engine SHALL 返回明确的错误信息
6. THE Audio_Engine SHALL 提取音频文件的基础元数据（标题、艺术家、专辑）

### 需求 7：错误处理与日志系统

**用户故事：** 作为开发者，我希望系统提供完善的错误处理和日志记录，以便快速定位和解决问题。

#### 验收标准

1. THE Audio_Engine SHALL 使用 Rust 的 Result 类型进行错误传播
2. THE Audio_Engine SHALL 定义标准化的错误类型（解码错误、IO 错误、配置错误）
3. THE Audio_Engine SHALL 记录所有错误到日志文件（位于用户数据目录）
4. THE Audio_Engine SHALL 提供不同的日志级别（INFO、WARN、ERROR）
5. WHEN 发生致命错误时，THE Audio_Engine SHALL 尝试优雅关闭并保存状态
6. THE Audio_Engine SHALL 限制日志文件大小（单个文件最大 10MB，最多保留 3 个文件）

### 需求 8：配置管理系统

**用户故事：** 作为用户，我希望自定义音频引擎的基础参数，以便根据个人需求调整系统行为。

#### 验收标准

1. THE Audio_Engine SHALL 从配置文件加载设置（TOML 格式）
2. THE Audio_Engine SHALL 提供默认配置，确保首次运行时正常工作
3. THE Audio_Engine SHALL 验证配置参数的有效性（范围检查、类型检查）
4. WHEN 配置文件损坏时，THE Audio_Engine SHALL 使用默认配置并记录警告
5. THE Audio_Engine SHALL 将配置文件存储在用户数据目录（遵循操作系统规范）

### 需求 9：测试与质量保证

**用户故事：** 作为质量保证工程师，我希望系统具有基础的测试覆盖，以便确保核心功能的正确性和稳定性。

#### 验收标准

1. THE Audio_Engine SHALL 包含单元测试，覆盖核心模块（解码器、DSP、数据库）
2. THE Audio_Engine SHALL 包含集成测试，验证前后端通信
3. FOR ALL 支持的音频格式，THE Audio_Engine SHALL 通过解码测试（使用标准测试音频文件）
4. THE Audio_Engine SHALL 在 CI/CD 管道中自动运行所有测试
5. THE Audio_Engine SHALL 包含基础的错误处理测试（无效文件、损坏数据）

### 需求 10：跨平台支持

**用户故事：** 作为用户，我希望在不同操作系统上使用音频引擎，以便在各种设备上享受一致的体验。

#### 验收标准

1. THE Audio_Engine SHALL 支持 Windows 10 及以上版本
2. THE Audio_Engine SHALL 支持 macOS 11 (Big Sur) 及以上版本
3. THE Audio_Engine SHALL 支持主流 Linux 发行版（Ubuntu 20.04+）
4. THE Audio_Engine SHALL 在所有平台上提供一致的 API 接口
5. THE Audio_Engine SHALL 使用跨平台音频库（CPAL 或 Rodio）处理平台差异

### 需求 11：文档与开发者体验

**用户故事：** 作为开发者，我希望有基础的文档和注释，以便理解和维护音频引擎代码。

#### 验收标准

1. THE Audio_Engine SHALL 提供 API 文档（使用 rustdoc 生成）
2. THE Audio_Engine SHALL 提供架构设计文档，说明各模块的职责和交互
3. THE Audio_Engine SHALL 在代码中包含必要的注释（关键算法和复杂逻辑）
4. THE Audio_Engine SHALL 提供开发环境设置指南（依赖安装、构建步骤）
5. THE Audio_Engine SHALL 提供基础的故障排查指南，列出常见问题和解决方案

## 未来增强路线图

以下特性将在 MVP 完成后的后续迭代中实现：

### 高级音频处理
- **HRTF 空间音频处理**：实现 3D 音频定位和空间音效
- **WSOLA 变速不变调算法**：支持 0.25x-2.0x 变速播放，保持音调
- **10 段参数均衡器**：精细化频率控制（31Hz-16kHz）
- **音量归一化**：支持 ReplayGain 标准

### 性能优化
- **SIMD 指令优化**：使用 SSE2/AVX2 加速 DSP 处理
- **零拷贝技术**：减少内存分配和拷贝开销
- **对象池管理**：优化音频缓冲区分配
- **流式传输优化**：大数据传输性能提升

### 高级功能
- **音频可视化**：FFT 频谱分析和实时可视化数据回传
- **推荐算法引擎**：基于音频特征和播放历史的智能推荐
- **CUE 分轨文件支持**：完整的 CUE 文件解析和播放
- **插件热重载**：无需重启的插件动态加载
- **高级音频格式**：OGG Vorbis、AAC/M4A、APE 等格式支持

### 数据库增强
- **全文搜索**：基于 SQLite FTS5 的高级搜索
- **连接池管理**：支持高并发查询
- **自动优化**：定期 VACUUM 和索引优化

### 开发者工具
- **插件开发指南**：完整的插件开发文档和示例
- **性能监控接口**：实时 CPU、内存、延迟指标
- **压力测试套件**：长时间运行稳定性测试
- **属性测试**：基于 Property-Based Testing 的算法验证

## 开发路线图（MVP 版本）

本项目 MVP 版本计划在 3-6 个月内完成，分为以下阶段：

### 阶段 1：基础架构搭建（4-6 周）
- 搭建 Tauri + Rust 项目结构
- 实现基础的前后端 IPC 通信
- 集成 Rodio/CPAL 音频输出
- 实现基础播放控制（播放、暂停、停止）

### 阶段 2：音频解码与数据库（4-6 周）
- 集成 Symphonia 解码库
- 实现 MP3、FLAC、WAV 格式支持
- 搭建 SQLite 数据库架构
- 实现元数据提取和存储
- 实现基础搜索功能

### 阶段 3：DSP 处理管线（3-4 周）
- 实现多线程音频处理架构
- 开发基础均衡器（5 段）
- 实现淡入淡出效果
- 实现音量控制

### 阶段 4：插件系统基础（2-3 周）
- 定义插件接口规范
- 实现插件注册机制
- 开发示例插件
- 编写插件开发文档

### 阶段 5：测试与优化（3-4 周）
- 编写单元测试和集成测试
- 实现 CI/CD 自动化测试
- 跨平台测试和调试
- 性能基准测试

### 阶段 6：文档与发布（2-3 周）
- 完善 API 文档
- 编写用户指南
- 准备发布版本
- 收集用户反馈

## 项目定位

这是一个工程化的音频引擎架构项目，专注于：

1. **清晰的架构设计**：展示前后端分离、多线程处理、模块化设计能力
2. **核心功能完整**：实现完整的音频播放流程，从解码到输出
3. **可扩展性**：通过插件系统和 DSP 管线设计，为未来扩展奠定基础
4. **工程化实践**：包含测试、文档、错误处理、配置管理等工程化要素
5. **跨平台能力**：支持主流操作系统，展示跨平台开发经验

MVP 版本聚焦于核心功能的实现和架构的完整性，高级特性将在后续迭代中逐步添加。
