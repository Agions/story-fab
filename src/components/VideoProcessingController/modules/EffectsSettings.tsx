/**
 * EffectsSettings Component
 * Part of VideoProcessingController - handles transition and audio effects
 */
import React from 'react';
import { Row, Col, Select, Slider, InputNumber, Switch, Space } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { TRANSITION_OPTIONS, AUDIO_PROCESS_OPTIONS } from '../constants';
import type { TransitionValue, AudioProcessValue } from '../constants';

const { Option } = Select;

interface EffectsSettingsProps {
  transitionType: TransitionValue;
  transitionDuration: number;
  audioProcess: AudioProcessValue;
  audioVolume: number;
  useSubtitles: boolean;
  onTransitionChange: (transition: TransitionValue) => void;
  onTransitionDurationChange: (duration: number) => void;
  onAudioProcessChange: (process: AudioProcessValue) => void;
  onAudioVolumeChange: (volume: number) => void;
  onSubtitlesChange: (useSubtitles: boolean) => void;
}

export const EffectsSettings: React.FC<EffectsSettingsProps> = ({
  transitionType,
  transitionDuration,
  audioProcess,
  audioVolume,
  useSubtitles,
  onTransitionChange,
  onTransitionDurationChange,
  onAudioProcessChange,
  onAudioVolumeChange,
  onSubtitlesChange,
}) => {
  return (
    <Row gutter={[16, 16]}>
      <Col span={16}>
        <div className="formItem">
          <div className="formLabel">转场效果</div>
          <Select
            value={transitionType}
            onChange={onTransitionChange}
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
          >
            {TRANSITION_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
      </Col>

      <Col span={8}>
        <div className="formItem">
          <div className="formLabel">转场时长 (秒)</div>
          <InputNumber
            min={0.2}
            max={3}
            step={0.1}
            value={transitionDuration}
            onChange={val => onTransitionDurationChange(val as number)}
            style={{ width: '100%' }}
          />
        </div>
      </Col>

      <Col span={12}>
        <div className="formItem">
          <div className="formLabel">音频处理</div>
          <Select
            value={audioProcess}
            onChange={onAudioProcessChange}
            style={{ width: '100%' }}
          >
            {AUDIO_PROCESS_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
      </Col>

      <Col span={12}>
        <div className="formItem">
          <div className="formLabel">
            <Space>
              <span>音量调整</span>
              <SoundOutlined />
            </Space>
            <span className="valueDisplay">{audioVolume}%</span>
          </div>
          <Slider
            min={0}
            max={200}
            step={5}
            value={audioVolume}
            onChange={onAudioVolumeChange}
            disabled={audioProcess === 'none'}
          />
        </div>
      </Col>

      <Col span={24}>
        <div className="formItem">
          <div className="formLabel">添加字幕</div>
          <Switch
            checked={useSubtitles}
            onChange={onSubtitlesChange}
          />
          <span className="switchDescription">
            将脚本内容作为字幕添加到视频中
          </span>
        </div>
      </Col>
    </Row>
  );
};

export default EffectsSettings;
