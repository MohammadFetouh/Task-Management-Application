import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TasksRepository } from './tasks.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TasksRepository)
    private tasksRepository: TasksRepository,
  ) {}

  getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    return this.tasksRepository.getTasks(filterDto, user);
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const found = await this.tasksRepository.findOne({ where: { id, user } });

    if (!found) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return found;
  }

  createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    return this.tasksRepository.createTask(createTaskDto, user);
  }

  async deleteTask(id: string, user: User): Promise<void> {
    const result = await this.tasksRepository.delete({ id, user });

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);

    task.status = status;
    await this.tasksRepository.save(task);

    return task;
  }

  async clockIn(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne(id);
    task.clockInTime = new Date();
    return this.tasksRepository.save(task);
  }

  async clockOut(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne(id);
    task.clockOutTime = new Date();
    return this.tasksRepository.save(task);
  }

  async getTaskTime(id: number): Promise<number> {
    const task = await this.tasksRepository.findOne(id);
    if (task && task.clockInTime && task.clockOutTime) {
      const duration = task.clockOutTime.getTime() - task.clockInTime.getTime();
      const minutes = Math.floor(duration / 60000);
      return minutes;
    }
    return 0;
  }
}
