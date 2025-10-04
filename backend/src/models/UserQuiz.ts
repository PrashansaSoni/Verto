import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import Quiz from './Quiz';
import UserAnswer from './UserAnswer';

export interface UserQuizAttributes {
  id: number;
  user_id: number;
  quiz_id: number;
  assigned_by?: number;
  assigned_at?: Date;
  start_time?: Date;
  end_time?: Date;
  score?: number;
  percentage?: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'expired';
  created_at?: Date;
  updated_at?: Date;
  // Associations
  quiz?: Quiz;
  userAnswers?: UserAnswer[];
}

interface UserQuizCreationAttributes extends Optional<UserQuizAttributes, 'id' | 'created_at' | 'updated_at'> {}

class UserQuiz extends Model<UserQuizAttributes, UserQuizCreationAttributes> implements UserQuizAttributes {
  public id!: number;
  public user_id!: number;
  public quiz_id!: number;
  public assigned_by?: number;
  public assigned_at?: Date;
  public start_time?: Date;
  public end_time?: Date;
  public score?: number;
  public percentage?: number;
  public status!: 'assigned' | 'in_progress' | 'completed' | 'expired';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  // Associations
  public quiz?: Quiz;
  public userAnswers?: UserAnswer[];
}

UserQuiz.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quizzes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('assigned', 'in_progress', 'completed', 'expired'),
      defaultValue: 'assigned',
    },
  },
  {
    sequelize,
    modelName: 'UserQuiz',
    tableName: 'user_quizzes',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'quiz_id'],
      },
    ],
  }
);

export default UserQuiz;
